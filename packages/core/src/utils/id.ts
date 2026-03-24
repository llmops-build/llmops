import { randomBytes } from 'node:crypto';

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateId = (size?: number) => {
  const length = size || 32;
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i]! % CHARS.length];
  }
  return result;
};
