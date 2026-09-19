import React, { useEffect, useState } from 'react';

import {
  BrowserRouter,
  Navigate,
  Link,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
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
} from './utils/api';

import { showFormattedDate } from './utils';

import {
  ThemeProvider,
  useTheme,
} from './contexts/ThemeContext';

import './styles/style.css';


// ==========================================
// APP
// ==========================================

function App() {
  const [token, setToken] = useState(
    localStorage.getItem('accessToken')
  );

  const [user, setUser] = useState(null);

  const [notes, setNotes] = useState([]);

  const [archivedNotes, setArchivedNotes] = useState([]);

  const [loading, setLoading] = useState(true);

  // ==========================================
  // CEK USER
  // ==========================================

  const loadUser = async (currentToken) => {
    try {
      const userData = await getUserLogged(currentToken);

      setUser(userData);
    } catch (error) {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
    }
  };

  // ==========================================
  // LOAD NOTES
  // ==========================================

  const loadNotes = async (currentToken) => {
    if (!currentToken) {
      return;
    }

    try {
      const [active, archived] = await Promise.all([
        getActiveNotes(currentToken),
        getArchivedNotes(currentToken),
      ]);

      setNotes(active);
      setArchivedNotes(archived);
    } catch (error) {
      alert(error.message);
    }
  };

  // ==========================================
  // CEK LOGIN SAAT APP DIBUKA
  // ==========================================

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      await loadUser(token);
      await loadNotes(token);

      setLoading(false);
    };

    checkAuthentication();
  }, [token]);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async ({ email, password }) => {
    const response = await login({
      email,
      password,
    });

    const accessToken = response.accessToken;

    localStorage.setItem(
      'accessToken',
      accessToken
    );

    setToken(accessToken);

    const userData = await getUserLogged(
      accessToken
    );

    setUser(userData);

    await loadNotes(accessToken);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('accessToken');

    setToken(null);
    setUser(null);
    setNotes([]);
    setArchivedNotes([]);
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    try {
      await deleteNote(token, id);

      await loadNotes(token);

      alert('Catatan berhasil dihapus.');
    } catch (error) {
      alert(error.message);
    }
  };

  // ==========================================
  // ARCHIVE
  // ==========================================

  const handleArchive = async (id) => {
    try {
      await archiveNote(token, id);

      await loadNotes(token);
    } catch (error) {
      alert(error.message);
    }
  };

  // ==========================================
  // UNARCHIVE
  // ==========================================

  const handleUnarchive = async (id) => {
    try {
      await unarchiveNote(token, id);

      await loadNotes(token);
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <h2>Memuat aplikasi...</h2>
      </div>
    );
  }

  return (
    <Routes>

      {/* =========================
          HALAMAN PUBLIK
      ========================= */}

      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />

      <Route
        path="/register"
        element={
          token ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterPage />
          )
        }
      />


      {/* =========================
          HALAMAN TERPROTEKSI
      ========================= */}

      <Route
        element={
          <ProtectedRoute token={token} />
        }
      >
        <Route
          element={
            <AppLayout
              user={user}
              onLogout={handleLogout}
            />
          }
        >
          <Route
            path="/"
            element={
              <HomePage
                notes={notes}
                onDelete={handleDelete}
              />
            }
          />

          <Route
            path="/notes/new"
            element={
              <AddNotePage
                token={token}
                onRefresh={() =>
                  loadNotes(token)
                }
              />
            }
          />

          <Route
            path="/notes/:id"
            element={
              <DetailPage
                token={token}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            }
          />

          <Route
            path="/archive"
            element={
              <ArchivePage
                notes={archivedNotes}
                onDelete={handleDelete}
                onUnarchive={handleUnarchive}
              />
            }
          />
        </Route>
      </Route>


      {/* =========================
          404
      ========================= */}

      <Route
        path="*"
        element={<NotFoundPage />}
      />

    </Routes>
  );
}


// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({ token }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}


// ==========================================
// LAYOUT
// ==========================================

function AppLayout({ user, onLogout }) {
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="app-container">

      <header>

        <h1>Catatan Pribadi</h1>

        <nav className="navigation">
          <ul>

            <li>
              <Link to="/">
                Catatan
              </Link>
            </li>

            <li>
              <Link to="/archive">
                Arsip
              </Link>
            </li>

            <li>
              <button
                type="button"
                className="theme-button"
                onClick={toggleTheme}
              >
                {theme === 'light'
                  ? '🌙'
                  : '☀️'}
              </button>
            </li>

          </ul>
        </nav>

        <div className="user-info">

          <span>
             {user?.name || user?.email}
          </span>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Keluar
          </button>

        </div>

      </header>

      <Outlet />

    </div>
  );
}


// ==========================================
// LOGIN
// ==========================================

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await onLogin({
        email,
        password,
      });

      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">

          <h1>Catatan Pribadi</h1>

          <p>
            Yuk, Login untuk Menggunakan Aplikasi
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              placeholder="Masukkan email"
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              placeholder="Masukkan password"
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Memproses...'
              : 'Masuk'}
          </button>

        </form>

        <p className="auth-footer">
          Belum punya akun?
          {' '}
          <Link to="/register">
            Daftar disini
          </Link>
        </p>

      </div>

    </div>
  );
}


// ==========================================
// REGISTER
// ==========================================

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (password !== confirmPassword) {
      setError(
        'Password dan konfirmasi password tidak sama.'
      );

      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
      });

      alert(
        'Registrasi berhasil. Silakan login.'
      );

      navigate('/login');

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">

          <div className="auth-icon">
            ✨
          </div>

          <h1>Buat Akun</h1>

          <p>
            Daftar untuk mulai membuat catatan.
          </p>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="name">
              Nama
            </label>

            <input
              id="name"
              type="text"
              value={name}
              placeholder="Nama kamu"
              onChange={(event) =>
                setName(event.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="register-email">
              Email
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              placeholder="Email kamu"
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="register-password">
              Password
            </label>

            <input
              id="register-password"
              type="password"
              value={password}
              placeholder="Password"
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="confirm-password">
              Konfirmasi Password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              placeholder="Ulangi password"
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              required
            />

          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Mendaftar...'
              : 'Daftar'}
          </button>

        </form>

        <p className="auth-footer">
          Sudah punya akun?
          {' '}
          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}


// ==========================================
// HOME
// ==========================================

function HomePage({ notes, onDelete }) {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const keyword =
    searchParams.get('keyword') || '';

  const filteredNotes = notes.filter(
    (note) =>
      note.title
        .toLowerCase()
        .includes(
          keyword.toLowerCase()
        )
  );

  const handleSearch = (event) => {
    setSearchParams({
      keyword: event.target.value,
    });
  };

  return (
    <main>

      <div className="page-heading">

        <h2>
          Daftar Catatan
        </h2>

        <p>
          Semua catatan kamu ada di sini.
        </p>

      </div>

      <div className="search-bar">

        <input
          type="text"
          placeholder="  Cari berdasarkan judul..."
          value={keyword}
          onChange={handleSearch}
        />

      </div>

      {filteredNotes.length === 0 ? (

        <div className="notes-list-empty">

          <div className="empty-icon">
            📝
          </div>

          <p>
            Tidak ada catatan.
          </p>

        </div>

      ) : (

        <div className="notes-list">

          {filteredNotes.map((note) => (

            <article
              className="note-item"
              key={note.id}
            >

              <h3 className="note-item__title">

                <Link
                  to={`/notes/${note.id}`}
                >
                  {note.title}
                </Link>

              </h3>

              <p className="note-item__createdAt">
                📅 {showFormattedDate(
                  note.createdAt
                )}
              </p>

              <p className="note-item__body">
                {note.body}
              </p>

              <button
                type="button"
                className="delete-button"
                onClick={() =>
                  onDelete(note.id)
                }
              >
                Hapus
              </button>

            </article>

          ))}

        </div>

      )}

      <div className="homepage__action">

        <Link
          to="/notes/new"
          className="action"
          title="Tambah catatan"
        >
          +
        </Link>

      </div>

    </main>
  );
}


// ==========================================
// ADD NOTE
// ==========================================

function AddNotePage({
  token,
  onRefresh,
}) {
  const navigate = useNavigate();

  const [title, setTitle] =
    useState('');

  const [body, setBody] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim() || !body.trim()) {
      alert(
        'Judul dan isi catatan harus diisi.'
      );

      return;
    }

    setLoading(true);

    try {
      await addNote(token, {
        title,
        body,
      });

      await onRefresh();

      navigate('/');

    } catch (error) {
      alert(error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <main>

      <div className="add-new-page">

        <h2>
          Tambah Catatan
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="add-new-page__input">

            <input
              className="add-new-page__input__title"
              type="text"
              maxLength="50"
              placeholder="Judul catatan..."
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              required
            />

            <textarea
              className="add-new-page__input__body"
              placeholder="Tulis catatan kamu di sini..."
              value={body}
              onChange={(event) =>
                setBody(
                  event.target.value
                )
              }
              required
            />

          </div>

          <div className="add-new-page__action">

            <button
              type="submit"
              className="action"
              title="Simpan"
              disabled={loading}
            >
              {loading ? '...' : '✓'}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}


// ==========================================
// DETAIL
// ==========================================

function DetailPage({
  token,
  onDelete,
  onArchive,
  onUnarchive,
}) {
  const { id } = useParams();

  const navigate = useNavigate();

  const [note, setNote] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data =
          await getNote(token, id);

        setNote(data);

      } catch (error) {
        alert(error.message);

      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [token, id]);

  if (loading) {
    return (
      <main>
        <div className="notes-list-empty">
          Memuat catatan...
        </div>
      </main>
    );
  }

  if (!note) {
    return (
      <main>
        <div className="notes-list-empty">
          Catatan tidak ditemukan.
        </div>
      </main>
    );
  }

  const handleDelete = async () => {
    await onDelete(note.id);
    navigate('/');
  };

  const handleArchive = async () => {
    if (note.archived) {
      await onUnarchive(note.id);
    } else {
      await onArchive(note.id);
    }

    navigate('/');
  };

  return (
    <main>

      <article className="detail-page">

        <h2 className="detail-page__title">
          {note.title}
        </h2>

        <p className="detail-page__createdAt">
          {showFormattedDate(
            note.createdAt
          )}
        </p>

        <p className="detail-page__body">
          {note.body}
        </p>

        <div className="detail-buttons">

          <button
            type="button"
            className="archive-button"
            onClick={handleArchive}
          >
            {note.archived
              ? '↩ Keluarkan dari Arsip'
              : '📦 Arsipkan'}
          </button>

          <button
            type="button"
            className="delete-button"
            onClick={handleDelete}
          >
            Hapus
          </button>

        </div>

      </article>

    </main>
  );
}


// ==========================================
// ARCHIVE
// ==========================================

function ArchivePage({
  notes,
  onDelete,
  onUnarchive,
}) {
  return (
    <main>

      <div className="page-heading">

        <h2>
          Catatan Arsip
        </h2>

        <p>
          Catatan yang sudah kamu arsipkan.
        </p>

      </div>

      {notes.length === 0 ? (

        <div className="notes-list-empty">

          <p>
            Arsip kosong.
          </p>

        </div>

      ) : (

        <div className="notes-list">

          {notes.map((note) => (

            <article
              className="note-item"
              key={note.id}
            >

              <h3 className="note-item__title">

                <Link
                  to={`/notes/${note.id}`}
                >
                  {note.title}
                </Link>

              </h3>

              <p className="note-item__createdAt">
                📅 {showFormattedDate(
                  note.createdAt
                )}
              </p>

              <p className="note-item__body">
                {note.body}
              </p>

              <div className="card-buttons">

                <button
                  type="button"
                  className="archive-button"
                  onClick={() =>
                    onUnarchive(note.id)
                  }
                >
                  Keluarkan
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() =>
                    onDelete(note.id)
                  }
                >
                   Hapus
                </button>

              </div>

            </article>

          ))}

        </div>

      )}

    </main>
  );
}


// ==========================================
// 404
// ==========================================

function NotFoundPage() {
  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="empty-icon">
          🔍
        </div>

        <h2>
          404
        </h2>

        <p>
          Halaman tidak ditemukan.
        </p>

        <Link
          to="/"
          className="auth-button"
        >
          Kembali
        </Link>

      </div>

    </div>
  );
}


// ==========================================
// ROOT
// ==========================================

function RootApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default RootApp;