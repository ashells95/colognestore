let cachedCsrfToken

async function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken

  const response = await fetch('/api/auth/csrf', { credentials: 'include' })
  const payload = response.status === 204 ? undefined : await response.json()
  if (!response.ok) {
    throw new Error(payload?.error || `API request failed (${response.status}).`)
  }

  cachedCsrfToken = payload.csrfToken
  return cachedCsrfToken
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-Token', await getCsrfToken())
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })
  const payload = response.status === 204 ? undefined : await response.json()

  if (!response.ok) {
    if (response.status === 403) cachedCsrfToken = undefined
    throw new Error(payload?.error || `API request failed (${response.status}).`)
  }

  return payload
}

export function getApiHealth({ signal } = {}) {
  return apiRequest('/api/health', { signal })
}
