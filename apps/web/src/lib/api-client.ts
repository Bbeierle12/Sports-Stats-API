// Use relative URL in production (same domain), localhost for dev
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
