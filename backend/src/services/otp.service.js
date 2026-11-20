import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import emailService from './email.service.js';

// In-memory fallback/cache: key = `${purpose}:${normalizedEmail}`
const otpMemoryStore = new Map();

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Generate cryptographically secure 6-digit OTP
 */
export const generateOtpCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Helper to get active record from DB or in-memory
 */
const getRecord = async (email, purpose) => {
  try {
    const record = await prisma.emailOtp.findUnique({
      where: { email_purpose: { email, purpose } }
    });
    if (record) return record;
  } catch (err) {
    console.warn('DB OTP lookup error, using memory fallback:', err.message);
  }

  return otpMemoryStore.get(`${purpose}:${email}`) || null;
};

/**
 * Create or refresh the OTP record for an email + purpose pair.
 */
const upsertOtpRecord = (email, purpose, code, expiresAt) => {
  const fields = { code, attempts: 0, expiresAt, createdAt: new Date() };
  return prisma.emailOtp.upsert({
    where: { email_purpose: { email, purpose } },
    create: { email, purpose, ...fields },
    update: fields
  });
};

/**
 * Send OTP for Account Creation / Email Verification
 */
export const sendSignupOtp = async ({ email, fullName }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new AppError(400, 'Valid email address is required', 'INVALID_EMAIL');
  }

  const existing = await getRecord(normalized, 'SIGNUP');
  const now = Date.now();

  // Rate limiting cooldown: 45 seconds
  if (existing) {
    const createdAtTime = new Date(existing.createdAt).getTime();
    if (now - createdAtTime < 45 * 1000) {
      const waitSeconds = Math.ceil((45 * 1000 - (now - createdAtTime)) / 1000);
      throw new AppError(
        429,
        `Please wait ${waitSeconds}s before requesting another verification code.`,
        'RATE_LIMITED'
      );
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes

  // Send email via Nodemailer first
  await emailService.sendSignupOtpEmail({
    toEmail: normalized,
    otp: code,
    fullName: fullName || 'Movie Lover'
  });

  try {
    await upsertOtpRecord(normalized, 'SIGNUP', code, expiresAt);
  } catch (err) {
    console.warn('DB OTP persist error, using memory fallback:', err.message);
  }

  // Also update memory store
  otpMemoryStore.set(`SIGNUP:${normalized}`, {
    code,
    expiresAt: expiresAt.getTime(),
    attempts: 0,
    createdAt: now,
    verified: false
  });

  return {
    success: true,
    message: `Verification code sent to ${normalized}`,
    expiresInSeconds: 600
  };
};

/**
 * Send OTP for Password Reset
 */
export const sendForgotPasswordOtp = async ({ email, fullName }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new AppError(400, 'Valid email address is required', 'INVALID_EMAIL');
  }

  const existing = await getRecord(normalized, 'FORGOT_PASSWORD');
  const now = Date.now();

  // Rate limiting cooldown: 45 seconds
  if (existing) {
    const createdAtTime = new Date(existing.createdAt).getTime();
    if (now - createdAtTime < 45 * 1000) {
      const waitSeconds = Math.ceil((45 * 1000 - (now - createdAtTime)) / 1000);
      throw new AppError(
        429,
        `Please wait ${waitSeconds}s before requesting another reset code.`,
        'RATE_LIMITED'
      );
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes

  // Send email via Nodemailer first
  await emailService.sendForgotPasswordOtpEmail({
    toEmail: normalized,
    otp: code,
    fullName: fullName || 'Valued User'
  });

  try {
    await upsertOtpRecord(normalized, 'FORGOT_PASSWORD', code, expiresAt);
  } catch (err) {
    console.warn('DB OTP persist error, using memory fallback:', err.message);
  }

  // Update memory store
  otpMemoryStore.set(`FORGOT_PASSWORD:${normalized}`, {
    code,
    expiresAt: expiresAt.getTime(),
    attempts: 0,
    createdAt: now,
    verified: false
  });

  return {
    success: true,
    message: `Password reset code sent to ${normalized}`,
    expiresInSeconds: 600
  };
};

/**
 * Verify OTP
 */
export const verifyOtp = async ({ email, otp, purpose, consume = true }) => {
  const normalized = normalizeEmail(email);
  const record = await getRecord(normalized, purpose);

  if (!record) {
    throw new AppError(
      400,
      'No active verification code found for this email. Please request a new code.',
      'OTP_NOT_FOUND'
    );
  }

  const now = Date.now();
  const expiresAtTime = new Date(record.expiresAt).getTime();
  if (expiresAtTime < now) {
    await deleteRecord(normalized, purpose);
    throw new AppError(
      400,
      'Verification code has expired. Please request a new one.',
      'OTP_EXPIRED'
    );
  }

  if (record.attempts >= 5) {
    await deleteRecord(normalized, purpose);
    throw new AppError(
      429,
      'Maximum verification attempts exceeded. Please request a new code.',
      'OTP_MAX_ATTEMPTS'
    );
  }

  const cleanProvided = String(otp || '').trim();
  if (record.code !== cleanProvided) {
    const nextAttempts = (record.attempts || 0) + 1;
    try {
      await prisma.emailOtp.updateMany({
        where: { email: normalized, purpose },
        data: { attempts: nextAttempts }
      });
    } catch (err) {
      console.warn('DB OTP attempt update error:', err.message);
    }
    const memKey = `${purpose}:${normalized}`;
    const mem = otpMemoryStore.get(memKey);
    if (mem) mem.attempts = nextAttempts;

    const remaining = 5 - nextAttempts;
    throw new AppError(
      400,
      `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : ''}`,
      'INVALID_OTP'
    );
  }

  // OTP is correct!
  if (consume) {
    await deleteRecord(normalized, purpose);
  } else {
    const memKey = `${purpose}:${normalized}`;
    const mem = otpMemoryStore.get(memKey);
    if (mem) mem.verified = true;
  }

  return { valid: true };
};

/**
 * Delete OTP record
 */
const deleteRecord = async (email, purpose) => {
  try {
    await prisma.emailOtp.deleteMany({ where: { email, purpose } });
  } catch (err) {
    console.warn('DB OTP delete error:', err.message);
  }
  otpMemoryStore.delete(`${purpose}:${email}`);
};

/**
 * Verify if OTP was previously checked/validated
 */
export const isOtpVerified = async ({ email, purpose }) => {
  const normalized = normalizeEmail(email);
  const memKey = `${purpose}:${normalized}`;
  const mem = otpMemoryStore.get(memKey);
  return Boolean(mem && mem.verified && mem.expiresAt > Date.now());
};

/**
 * Consume verified record
 */
export const consumeOtp = async ({ email, purpose }) => {
  const normalized = normalizeEmail(email);
  await deleteRecord(normalized, purpose);
};

export default {
  sendSignupOtp,
  sendForgotPasswordOtp,
  verifyOtp,
  isOtpVerified,
  consumeOtp
};
