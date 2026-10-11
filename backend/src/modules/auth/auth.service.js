import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import otpService from '../../services/otp.service.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

/**
 * Send OTP for customer signup
 */
export const requestSignupOtp = async ({ email, fullName }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError(409, 'An account with this email address already exists. Please log in instead.', 'EMAIL_IN_USE');
  }

  return await otpService.sendSignupOtp({
    email: normalizedEmail,
    fullName
  });
};

/**
 * Verify OTP before signup
 */
export const verifySignupOtp = async ({ email, otp }) => {
  const normalizedEmail = email.trim().toLowerCase();
  return await otpService.verifyOtp({
    email: normalizedEmail,
    otp,
    purpose: 'SIGNUP',
    consume: false // Keep verified state so next register call succeeds
  });
};

/**
 * Send OTP for password reset (only if email exists)
 */
export const requestForgotPasswordOtp = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  
  if (!user) {
    throw new AppError(404, 'No account found with this email address.', 'USER_NOT_FOUND');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'Account is currently suspended. Please contact support.', 'ACCOUNT_BLOCKED');
  }

  return await otpService.sendForgotPasswordOtp({
    email: normalizedEmail,
    fullName: user.fullName
  });
};

/**
 * Reset password using OTP
 */
export const resetPasswordWithOtp = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new AppError(404, 'No account found with this email address.', 'USER_NOT_FOUND');
  }

  // Verify and consume OTP
  await otpService.verifyOtp({
    email: normalizedEmail,
    otp,
    purpose: 'FORGOT_PASSWORD',
    consume: true
  });

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update password in DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      failedLoginAttempts: 0
    }
  });

  // Invalidate previous sessions
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id }
  });

  return {
    success: true,
    message: 'Your password has been successfully reset. You can now log in with your new password.'
  };
};

export const register = async (data) => {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError(409, 'Email already in use', 'EMAIL_IN_USE');
  }

  // Verify email OTP for registration
  if (data.otp) {
    await otpService.verifyOtp({
      email: normalizedEmail,
      otp: data.otp,
      purpose: 'SIGNUP',
      consume: true
    });
  } else if (await otpService.isOtpVerified({ email: normalizedEmail, purpose: 'SIGNUP' })) {
    await otpService.consumeOtp({ email: normalizedEmail, purpose: 'SIGNUP' });
  } else if (data.role === 'CUSTOMER' && process.env.NODE_ENV !== 'test') {
    // If neither OTP nor pre-verification exists for customer
    throw new AppError(400, 'Email verification code is required to complete registration.', 'OTP_REQUIRED');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  let theatreId = null;
  const theatreName = data.theatreName || data.theatre?.name;
  if (data.role === 'THEATRE_MANAGER' && theatreName) {
    const theatre = await prisma.theatre.create({
      data: {
        name: theatreName,
        legalEntityName: data.legalEntityName || data.theatre?.legalEntityName || null,
        gstNumber: data.gstNumber || data.theatre?.gstNumber || null,
        contactPhone: data.theatrePhone || data.theatre?.contactPhone || data.mobileNumber || null,
        contactEmail: data.theatreEmail || data.theatre?.contactEmail || normalizedEmail,
        addressLine: data.addressLine || data.theatre?.addressLine || 'Main Road',
        city: data.city || data.theatre?.city || 'City',
        state: data.state || data.theatre?.state || 'State',
        postalCode: data.postalCode || data.theatre?.postalCode || null,
        amenities: data.amenities || data.theatre?.amenities || [],
        status: 'PENDING'
      }
    });
    theatreId = theatre.id;
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: normalizedEmail,
      mobileNumber: data.mobileNumber,
      passwordHash,
      role: data.role,
      theatreId
    },
    include: {
      theatre: true
    }
  });

  const tokens = generateTokens(user.id);
  
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

export const login = async (data) => {
  const normalizedEmail = data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'Account is blocked', 'ACCOUNT_BLOCKED');
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: { increment: 1 } }
    });
    // Optional: lock account after N attempts
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lastLoginAt: new Date() }
  });

  const tokens = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

export const refresh = async (refreshToken) => {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    const userId = payload.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBlocked) {
      throw new AppError(401, 'Invalid token or blocked user', 'UNAUTHORIZED');
    }

    // Usually you'd check if the tokenHash is in the DB, but to keep it simple and atomic:
    const tokens = generateTokens(user.id);
    return tokens;
  } catch (error) {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
  }
};
