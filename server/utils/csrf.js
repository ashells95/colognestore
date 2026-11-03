const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

function issueCsrfToken(secret) {
  const nonce = randomBytes(32).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update('colognestore-csrf-v1')
    .update(nonce)
    .digest('base64url');
  return `${nonce}.${signature}`;
}

function isValidCsrfToken(token, secret) {
  if (
    typeof token !== 'string' ||
    !/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(token)
  ) {
    return false;
  }

  const [nonce, signature] = token.split('.');

  const expected = createHmac('sha256', secret)
    .update('colognestore-csrf-v1')
    .update(nonce)
    .digest();
  let actual;

  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function safeTokenEquals(first, second) {
  if (typeof first !== 'string' || typeof second !== 'string') {
    return false;
  }

  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

module.exports = { isValidCsrfToken, issueCsrfToken, safeTokenEquals };
