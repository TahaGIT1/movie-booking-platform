import crypto from 'crypto';
import { AppError } from '../../middleware/error.middleware.js';

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new AppError(503, `Payment gateway is not configured (${name})`, 'PAYMENT_NOT_CONFIGURED');
  return value;
};

export const createRazorpayOrder = async ({ amountPaise, receipt, notes = {} }) => {
  const keyId = requiredEnv('RAZORPAY_KEY_ID');
  const keySecret = requiredEnv('RAZORPAY_KEY_SECRET');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AppError(502, data.error?.description || 'Could not create Razorpay order', 'PAYMENT_ORDER_FAILED');
  return { order: data, keyId };
};

export const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  const secret = requiredEnv('RAZORPAY_KEY_SECRET');
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  let actual;
  try { actual = Buffer.from(signature, 'hex'); } catch { return false; }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

export const fetchRazorpayPayment = async (paymentId) => {
  const keyId = requiredEnv('RAZORPAY_KEY_ID');
  const keySecret = requiredEnv('RAZORPAY_KEY_SECRET');
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AppError(502, data.error?.description || 'Could not verify Razorpay payment', 'PAYMENT_LOOKUP_FAILED');
  return data;
};

export const captureRazorpayPayment = async ({ paymentId, amountPaise, currency = 'INR' }) => {
  const keyId = requiredEnv('RAZORPAY_KEY_ID');
  const keySecret = requiredEnv('RAZORPAY_KEY_SECRET');
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: amountPaise, currency })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new AppError(502, data.error?.description || 'Could not capture Razorpay payment', 'PAYMENT_CAPTURE_FAILED');
  return data;
};

export const paymentQrToken = (bookingId) => {
  const secret = requiredEnv('TICKET_QR_SECRET');
  return crypto.createHmac('sha256', secret).update(bookingId).digest('hex');
};
