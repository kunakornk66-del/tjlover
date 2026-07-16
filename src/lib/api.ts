const API_URL = ''; // Same domain, using relative paths for simplicity

function getHeaders() {
  const token = localStorage.getItem('couple_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch (err: any) {
      if (err instanceof Error && err.message !== 'Something went wrong' && !err.message.startsWith('Unauthorized')) {
        throw err;
      }
      throw new Error(`Failed to parse JSON response: ${err.message}`);
    }
  } else {
    const text = await response.text();
    throw new Error(`Expected JSON but received ${contentType || 'unknown content type'} (Status ${response.status} ${response.statusText}): ${text.substring(0, 100)}...`);
  }
}
