const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiClient(endpoint, options) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error || body?.mensaje || `Error ${response.status}`);
  }

  return body;
}
