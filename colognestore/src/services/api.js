let cachedCsrfToken

async function readPayload(response) {
  if (response.status === 204) return undefined

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json') && !contentType.includes('+json')) {
    return undefined
  }

  return response.json()
}

async function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken

  const response = await fetch('/api/auth/csrf', { credentials: 'include' })
  const payload = await readPayload(response)
  if (!response.ok) {
    throw new Error(payload?.error || `API request failed (${response.status}).`)
  }

  if (typeof payload?.csrfToken !== 'string') {
    throw new Error('The API returned an invalid CSRF token response.')
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
  const payload = await readPayload(response)

  if (!response.ok) {
    if (response.status === 403) cachedCsrfToken = undefined
    throw new Error(payload?.error || `API request failed (${response.status}).`)
  }

  if (response.status !== 204 && payload === undefined) {
    throw new Error(
      'The API returned an unexpected response. Check that the backend and /api proxy are running.',
    )
  }

  return payload
}

export function getApiHealth({ signal } = {}) {
  return apiRequest('/api/health', { signal })
}

export function getProducts(queryString, { signal } = {}) {
  const query = queryString ? `?${queryString}` : ''
  return apiRequest(`/api/products${query}`, { signal })
}
