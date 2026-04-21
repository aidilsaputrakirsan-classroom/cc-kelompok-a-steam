const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ==================== TOKEN MANAGEMENT ====================

const TOKEN_KEY = "inti_rupa_token"

// Restore token dari localStorage saat app pertama load
let authToken = localStorage.getItem(TOKEN_KEY) || null

export function setToken(token) {
  authToken = token
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return authToken
}

export function clearToken() {
  authToken = null
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
  const headers = {}
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  return headers
}

// Helper: handle response errors
async function handleResponse(response) {
  if (response.status === 401) {
    clearToken()
    throw new Error("UNAUTHORIZED")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    let errorMessage = error.detail
    if (Array.isArray(error.detail)) {
      errorMessage = error.detail.map(d => d.msg).join(', ')
    }
    throw new Error(errorMessage || `Request gagal (${response.status})`)
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

export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`)
    const data = await response.json()
    return data.status === "healthy"
  } catch {
    return false
  }
}

export async function generateImage(params) {
  const response = await fetch(`${API_URL}/generate/image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(params),
  })
  return handleResponse(response)
}

// ==================== SUMMARIZE API ====================

export async function summarizeText(sourceContent, sourceType = "text") {
  const response = await fetch(`${API_URL}/generate/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ source_type: sourceType, source_content: sourceContent }),
  })
  return handleResponse(response)
}

// ==================== HISTORY API ====================

export async function getImageHistory(skip = 0, limit = 20) {
  const response = await fetch(`${API_URL}/history/images?skip=${skip}&limit=${limit}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function deleteImageHistory(id) {
  const response = await fetch(`${API_URL}/history/images/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function getSummaryHistory(skip = 0, limit = 20) {
  const response = await fetch(`${API_URL}/history/summaries?skip=${skip}&limit=${limit}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function deleteSummaryHistory(id) {
  const response = await fetch(`${API_URL}/history/summaries/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function getAllHistory(skip = 0, limit = 50) {
  const response = await fetch(`${API_URL}/history/all?skip=${skip}&limit=${limit}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
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

export async function continueChatSession(id, payload) {
  const response = await fetch(`${API_URL}/chat/sessions/${id}/continue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
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