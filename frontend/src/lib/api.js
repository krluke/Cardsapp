const API_BASE = '/api'

function getSession() {
  return JSON.parse(localStorage.getItem('session') || '{}')
}

function setSession(session) {
  localStorage.setItem('session', JSON.stringify(session))
}

function getJwtToken() {
  return getSession().token || ''
}

function getCsrfToken() {
  return getSession().csrfToken || ''
}

async function refreshJwtToken() {
  const token = getJwtToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_BASE}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.token) {
      const session = getSession()
      session.token = data.token
      setSession(session)
      return data.token
    }
    return null
  } catch {
    return null
  }
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
    const newToken = await refreshJwtToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
    }
  }

  return res
}

export { API_BASE, getJwtToken, getCsrfToken }
