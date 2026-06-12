/**
 * API Service — Gateway-based microservices
 *
 * Frontend mengarah ke GATEWAY (http://localhost) yang mengarahkan ke:
 * - /auth/* → Auth Service
 * - /items/* → Item Service
 * - / → Frontend
 */

// Helper untuk membuat fetch signal dengan timeout
function timeoutSignal(ms = 5000) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(ms)
  }
  return undefined
}

// Gateway URL (bukan langsung ke backend port 8000)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost"

// ==================== TOKEN MANAGEMENT ====================

const TOKEN_KEY = "inti_rupa_token"

// Restore token dari localStorage saat app pertama load
let authToken = null
if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
  authToken = localStorage.getItem(TOKEN_KEY) || null
}

export function setToken(token) {
  authToken = token
  if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getToken() {
  return authToken
}

export function clearToken() {
  authToken = null
  if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

function authHeaders() {
  const headers = {}
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  return headers
}

/**
 * Handle API response dengan error handling untuk service unavailable (503)
 * Jika service down (503), throw error dengan type 'SERVICE_UNAVAILABLE'
 */
async function handleResponse(response) {
  if (response.status === 401) {
    clearToken()
    const error = new Error("UNAUTHORIZED")
    error.type = "UNAUTHORIZED"
    throw error
  }

  // Service Unavailable (degraded mode atau service down)
  if (response.status === 503) {
    const error = new Error("Service temporarily unavailable. Please try again later.")
    error.type = "SERVICE_UNAVAILABLE"
    error.status = 503
    throw error
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    let errorMessage = error.detail
    if (Array.isArray(error.detail)) {
      errorMessage = error.detail.map(d => d.msg).join(', ')
    }
    const err = new Error(errorMessage || `Request gagal (${response.status})`)
    err.status = response.status
    throw err
  }

  // 204 No Content
  if (response.status === 204) return null
  return response.json()
}

// ==================== AUTH API ====================

export async function register(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  return handleResponse(response)
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await handleResponse(response)
  setToken(data.access_token)
  return data
}

export async function getMe() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

// ==================== ITEMS API ====================

export async function fetchItems(search = "", skip = 0, limit = 20) {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  params.append("skip", skip)
  params.append("limit", limit)

  const response = await fetch(`${API_URL}/items?${params}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function createItem(itemData) {
  const response = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function updateItem(id, itemData) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function deleteItem(id) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

// ==================== HEALTH & MONITORING API ====================

/**
 * Check Gateway health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, { signal: timeoutSignal(5000) })
    if (!response.ok) return null
    const data = await response.json()
    return data
  } catch {
    return null
  }
}

/**
 * Fetch health status dari Auth Service
 */
export async function fetchAuthHealth() {
  try {
    const response = await fetch(`${API_URL}/auth/health`, { signal: timeoutSignal(5000) })
    if (!response.ok) return null
    const data = await response.json()
    return data
  } catch {
    return null
  }
}

/**
 * Fetch health status dari Item Service
 */
export async function fetchItemsHealth() {
  try {
    const response = await fetch(`${API_URL}/items/health`, { signal: timeoutSignal(5000) })
    if (!response.ok) return null
    const data = await response.json()
    return data
  } catch {
    return null
  }
}

/**
 * Fetch metrics dari Auth Service
 */
export async function fetchAuthMetrics() {
  try {
    const response = await fetch(`${API_URL}/auth/metrics`, { signal: timeoutSignal(5000) })
    if (!response.ok) return null
    const data = await response.json()
    return data
  } catch {
    return null
  }
}

/**
 * Fetch metrics dari Item Service
 */
export async function fetchItemsMetrics() {
  try {
    const response = await fetch(`${API_URL}/items/metrics`, { signal: timeoutSignal(5000) })
    if (!response.ok) return null
    const data = await response.json()
    return data
  } catch {
    return null
  }
}



// ==================== CHAT SESSIONS API ====================

export async function createChatSession(payload) {
  const response = await fetch(`${API_URL}/chat/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function getChatSessions(skip = 0, limit = 30) {
  const response = await fetch(`${API_URL}/chat/sessions?skip=${skip}&limit=${limit}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function getChatSessionById(id) {
  const response = await fetch(`${API_URL}/chat/sessions/${id}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function continueChatSession(id, payload, options = {}) {
  const response = await fetch(`${API_URL}/chat/sessions/${id}/continue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  })
  return handleResponse(response)
}

export async function updateChatSessionTitle(id, title) {
  const response = await fetch(`${API_URL}/chat/sessions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ title }),
  })
  return handleResponse(response)
}

export async function deleteChatSession(id) {
  const response = await fetch(`${API_URL}/chat/sessions/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

// ==================== STATS API ====================

export async function getUserStats() {
  const response = await fetch(`${API_URL}/stats`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}