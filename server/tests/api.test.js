const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const clientOrigin = 'http://localhost:5173';
const server = createApp({
  clientOrigins: [clientOrigin],
  cookieSameSite: 'lax',
  jwtSecret: 'test-secret-with-more-than-thirty-two-bytes',
}).listen(0);

const baseUrl = new Promise((resolve) => {
  server.once('listening', () => {
    resolve(`http://127.0.0.1:${server.address().port}`);
  });
});

test.after(() => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
}));

test('health endpoint reports database readiness without exposing connection details', async () => {
  const response = await fetch(`${await baseUrl}/api/health`, {
    headers: { origin: clientOrigin },
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get('access-control-allow-origin'), clientOrigin);
  assert.deepEqual(body, {
    status: 'unavailable',
    service: 'api',
    database: 'disconnected',
  });
});

test('unsafe requests require a signed CSRF token and approved origin', async () => {
  const origin = { origin: clientOrigin };
  const missingToken = await fetch(`${await baseUrl}/api/unmatched`, {
    method: 'POST',
    headers: origin,
  });
  assert.equal(missingToken.status, 403);

  const csrfResponse = await fetch(`${await baseUrl}/api/auth/csrf`, { headers: origin });
  const { csrfToken } = await csrfResponse.json();
  const cookie = csrfResponse.headers.get('set-cookie').split(';', 1)[0];
  const secondCsrfResponse = await fetch(`${await baseUrl}/api/auth/csrf`, {
    headers: { ...origin, cookie },
  });
  assert.equal((await secondCsrfResponse.json()).csrfToken, csrfToken);

  const acceptedToken = await fetch(`${await baseUrl}/api/unmatched`, {
    method: 'POST',
    headers: {
      ...origin,
      cookie,
      'x-csrf-token': csrfToken,
    },
  });
  assert.equal(acceptedToken.status, 404);
});

test('invalid API inputs return validation errors before reaching database handlers', async () => {
  const queryResponse = await fetch(`${await baseUrl}/api/products?page=0`, {
    headers: { origin: clientOrigin },
  });
  assert.equal(queryResponse.status, 400);

  const csrfResponse = await fetch(`${await baseUrl}/api/auth/csrf`, {
    headers: { origin: clientOrigin },
  });
  const { csrfToken } = await csrfResponse.json();
  const cookie = csrfResponse.headers.get('set-cookie').split(';', 1)[0];
  const registerResponse = await fetch(`${await baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      origin: clientOrigin,
      cookie,
      'content-type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({
      name: 'Customer',
      email: 'customer@example.com',
      password: 'a-secure-password',
      role: 'admin',
    }),
  });
  assert.equal(registerResponse.status, 400);
});

test('unapproved browser origins are rejected', async () => {
  const response = await fetch(`${await baseUrl}/api/health`, {
    headers: { origin: 'https://untrusted.example' },
  });

  assert.equal(response.status, 403);
});

test('admin product routes require authentication', async () => {
  const response = await fetch(`${await baseUrl}/api/products/admin`, {
    headers: { origin: clientOrigin },
  });

  assert.equal(response.status, 401);
});
