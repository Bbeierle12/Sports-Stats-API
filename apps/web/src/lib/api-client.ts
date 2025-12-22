// Use relative URL in production (same domain), localhost for dev
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const API_BASE_URL = isDev ? 'http://localhost:3001/api' : '/api'

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
