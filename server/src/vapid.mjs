// VAPID key pair for Web Push (phone / desktop pop-up notifications on the admin dashboard).
// Keys are P-256 (prime256v1): public key = 65-byte uncompressed point, private key = 32-byte scalar,
// both base64url-encoded — the format browsers and the web-push library expect.
import { createECDH } from 'node:crypto';

export function generateVapidKeys() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const pad = (buf, len) => (buf.length >= len ? buf : Buffer.concat([Buffer.alloc(len - buf.length), buf]));
  return {
    publicKey: pad(ecdh.getPublicKey(), 65).toString('base64url'),
    privateKey: pad(ecdh.getPrivateKey(), 32).toString('base64url'),
  };
}

// Basic shape check used by config validation (does not prove the pair matches).
export const looksLikeVapidKeys = (pub, priv) =>
  /^[A-Za-z0-9_-]{86,88}$/.test(pub || '') && Buffer.from(pub, 'base64url').length === 65 &&
  /^[A-Za-z0-9_-]{42,44}$/.test(priv || '') && Buffer.from(priv, 'base64url').length === 32;
