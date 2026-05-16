import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];

if (!JWT_SECRET) {
  console.warn('[auth] JWT_SECRET não configurado — auth não funcionará');
}

export interface TokenPayload {
  sub: string;
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: TokenPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET ausente');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  if (!JWT_SECRET) throw new Error('JWT_SECRET ausente');
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub || !('email' in decoded)) {
    throw new Error('Token inválido');
  }
  return { sub: String(decoded.sub), email: String(decoded.email) };
}
