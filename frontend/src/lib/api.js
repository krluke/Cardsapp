const API_BASE = '/api'

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
    window.location.reload()
  }

  if (!res.ok) {
    return res
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json') || ct.includes('application/problem+json')) {
    return res
  }

  const text = await res.text()
  throw new Error(`API returned ${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
}

export { API_BASE, getJwtToken, getCsrfToken }
