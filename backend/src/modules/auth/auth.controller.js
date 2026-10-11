import * as authService from './auth.service.js';
import { prisma } from '../../config/prisma.js';
import { io } from '../../socket.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const sendSignupOtp = async (req, res, next) => {
  try {
    const result = await authService.requestSignupOtp(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const verifySignupOtp = async (req, res, next) => {
  try {
    const result = await authService.verifySignupOtp(req.body);
    res.json({ success: true, message: 'OTP verified successfully', ...result });
  } catch (error) {
    next(error);
  }
};

export const sendForgotPasswordOtp = async (req, res, next) => {
  try {
    const result = await authService.requestForgotPasswordOtp(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPasswordWithOtp(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req, res) => {
  res.json({ success: true, data: req.user });
};

export const updateMe = async (req, res, next) => {
  try {
    const { fullName, mobileNumber, preferences } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(preferences && { preferences })
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        mobileNumber: true,
        role: true,
        preferences: true,
        theatreId: true
      }
    });
    res.json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      // Automatically release any seats currently on hold by this user
      const activeHolds = await prisma.showSeatStatus.findMany({
        where: {
          lockedByUserId: userId,
          lockExpiresAt: { gt: new Date() }
        },
        select: { id: true, showId: true, seatId: true }
      });

      if (activeHolds.length > 0) {
        await prisma.showSeatStatus.updateMany({
          where: {
            id: { in: activeHolds.map((h) => h.id) }
          },
          data: {
            lockedByUserId: null,
            lockExpiresAt: null
          }
        });

        // Notify real-time listeners for all affected shows
        for (const hold of activeHolds) {
          io.to(`show:${hold.showId}`).emit('seat:released', { seatId: hold.seatId });
        }
      }

      // Revoke user refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });
    }

    res.json({ success: true, message: 'Logged out and all active seat holds released' });
  } catch (error) {
    next(error);
  }
};
