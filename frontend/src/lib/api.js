const API_BASE = '/api'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('session') || '{}')
  } catch {
    return {}
  }
}

function getJwtToken() {
  return getSession().token || ''
}

function getCsrfToken() {
  return getSession().csrfToken || ''
}

export async function apiFetch(endpoint, options = {}) {
  const jwtToken = getJwtToken()
  const csrfToken = getCsrfToken()

  const headers = {
    ...options.headers,
  }
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`
  }
  if (csrfToken && options.method && options.method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken
  }

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })

  if (res.status === 401 && jwtToken) {
    localStorage.removeItem('session')
    window.dispatchEvent(new CustomEvent('session-expired'))
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json') || ct.includes('application/problem+json')) {
      const data = await res.json().catch(() => null)
      throw new ApiError(res.status, data?.message || res.statusText)
    }
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, `${res.statusText}: ${text.slice(0, 200)}`)
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json') || ct.includes('application/problem+json')) {
    return res
  }

  const text = await res.text()
  throw new ApiError(res.status, `Unexpected content type: ${text.slice(0, 200)}`)
}

export { API_BASE }
