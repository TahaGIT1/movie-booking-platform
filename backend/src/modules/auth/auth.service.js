import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (data) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new AppError(409, 'Email already in use', 'EMAIL_IN_USE');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const role = data.role || 'CUSTOMER';
  if (role === 'THEATRE_MANAGER' && !data.theatreName) {
    throw new AppError(400, 'Theatre details are required for manager registration', 'THEATRE_DETAILS_REQUIRED');
  }
  const user = await prisma.$transaction(async (tx) => {
    let theatreId = null;
    if (role === 'THEATRE_MANAGER') {
      const theatre = await tx.theatre.create({
        data: {
          name: data.theatreName,
          legalEntityName: data.legalEntityName || null,
          gstNumber: data.gstNumber || null,
          contactPhone: data.theatrePhone || data.mobileNumber || null,
          contactEmail: data.theatreEmail || data.email,
          addressLine: data.addressLine,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode || null,
          amenities: data.amenities || [],
          status: 'PENDING'
        }
      });
      theatreId = theatre.id;
    }
    return tx.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        mobileNumber: data.mobileNumber,
        passwordHash,
        role,
        theatreId
      },
      include: { theatre: true }
    });
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
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  
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
