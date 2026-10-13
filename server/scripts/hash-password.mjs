// Usage: npm run hash-password -- "your strong password"
// Prints a value for ADMIN_PASSWORD_HASH. The plain password is never stored.
import { hashPassword } from '../src/auth.mjs';

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error('Usage: npm run hash-password -- "a password of at least 12 characters"');
  process.exit(1);
}
console.log(hashPassword(pw));
