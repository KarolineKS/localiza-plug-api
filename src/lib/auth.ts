import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD;

if (!JWT_SECRET) console.warn('[auth] JWT_SECRET ausente');
if (!ADMIN_PASSWORD_HASH) console.warn('[auth] ADMIN_PASSWORD ausente');

export interface TokenPayload {
  role: 'admin';
}

export async function verifyAdminPassword(plain: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) return false;
  return bcrypt.compare(plain, ADMIN_PASSWORD_HASH);
}

export function signAdminToken(): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET ausente');
  return jwt.sign({ role: 'admin' } satisfies TokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  if (!JWT_SECRET) throw new Error('JWT_SECRET ausente');
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string' || decoded.role !== 'admin') {
    throw new Error('Token inválido');
  }
  return { role: 'admin' };
}
