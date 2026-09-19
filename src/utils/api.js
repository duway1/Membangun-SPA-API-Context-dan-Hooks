const BASE_URL = 'https://notes-api.dicoding.dev/v1';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const responseJson = await response.json();

  if (!response.ok) {
    throw new Error(
      responseJson.message || 'Terjadi kesalahan pada server.'
    );
  }

  return responseJson.data;
}

// =========================
// AUTH
// =========================

async function register({ name, email, password }) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

async function login({ email, password }) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

async function getUserLogged(token) {
  return apiRequest('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// =========================
// NOTES
// =========================

async function getActiveNotes(token) {
  return apiRequest('/notes', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function getArchivedNotes(token) {
  return apiRequest('/notes/archived', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function getNote(token, id) {
  return apiRequest(`/notes/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function addNote(token, { title, body }) {
  return apiRequest('/notes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      body,
    }),
  });
}

async function deleteNote(token, id) {
  return apiRequest(`/notes/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function archiveNote(token, id) {
  return apiRequest(`/notes/${id}/archive`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function unarchiveNote(token, id) {
  return apiRequest(`/notes/${id}/archive`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export {
  register,
  login,
  getUserLogged,
  getActiveNotes,
  getArchivedNotes,
  getNote,
  addNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
};