import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams, } from 'react-router-dom';
import { getAllNotes, addNote, deleteNote, archiveNote, unarchiveNote, } from './utils/local-data';
import { showFormattedDate } from './utils';

function App () {
  const [notes, setNotes] = useState(getAllNotes());
  const refreshNotes = () => { 
    setNotes([...getAllNotes()]); 
  };

  const handleAddNote = ({ title, body }) => { 
    addNote({ 
      title, 
      body, 
    }); 
    refreshNotes(); 
  };

  const handleDeleteNote = (id) => { 
    deleteNote(id); 
    refreshNotes(); 
  };

  const handleArchiveNote = (id) => { 
    archiveNote(id); 
    refreshNotes(); 
  };

  const handleUnarchiveNote = (id) => { 
    unarchiveNote(id); 
    refreshNotes(); 
  };

  return (
    <BrowserRouter>
    <header>
      <h1>
        Catatan Pribadi
      </h1>

      <nav className='navigation'>
        <Link to="/">Catatan</Link> {'|'}
        <Link to="/archive">Arsip</Link> {'|'}
        <Link to="/notes/new">Tambah Catatan</Link>
      </nav>
    </header>
    <main>
      <Routes>
        <Route path="/" element={ <HomePage notes={notes} onDelete={handleDeleteNote} /> } />
        <Route path="/notes/new" element={ <AddNotePage onAddNote={handleAddNote} /> } />
        <Route path="/notes/:id" element={ <DetailPage notes={notes} onDelete={handleDeleteNote} onArchive={handleArchiveNote} onUnarchive={handleUnarchiveNote} /> } />
        <Route path="/archive" element={ <ArchivePage notes={notes} onDelete={handleDeleteNote} onUnarchive={handleUnarchiveNote} /> } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
    </BrowserRouter>
  );

  function HomePage({ notes, onDelete }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get('keyword') || '';
    
    const activeNotes = notes.filter((note) => {
      return !note.archived &&
        note.title.toLowerCase().includes(keyword.toLowerCase());
    });

    const handleSearch = (event) => {
      setSearchParams({
        keyword: event.target.value,
      });
    };

    return (
      <main>
        <h2>Daftar Catatan</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cari berdasarkan judul..."
            value={keyword}
            onChange={handleSearch}
          />
        </div>

        <NotesList notes={activeNotes} onDelete={onDelete} />

        <div className="homepage__action">
           <Link to="/notes/new" className="action" title="Tambah catatan">
           +
          </Link>
        </div>
      </main>
    );
  }

  function NotesList({ notes, onDelete }) {
    return (
      <div>
        {notes.map((note) => ( 
          <article key={note.id} className="note-item" >
            <h3>
              <Link to={`/notes/${note.id}`}> {note.title} </Link>
            </h3><br />
            <p>{showFormattedDate(note.createdAt)}</p><br />
            <p>{note.body}</p><br />
            <button type="button" onClick={() => onDelete(note.id)} > Hapus </button>
          </article>
        ))}
      </div>
    );
  }

  function DetailPage({
    notes, 
    onDelete, 
    onArchive, 
    onUnarchive,
  }) {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const note = notes.find( (item) => item.id === id );
    if (!note) { 
      return <NotFoundPage />; 
    };

    const handleDelete = () => { 
      onDelete(note.id); 
      navigate('/'); 
    };

    const handleArchive = () => { 
      if (note.archived) { 
        onUnarchive(note.id); 
      } else { 
        onArchive(note.id); 
      } 
    };

    return (
      <article lassName="detail-page">
        <h2>{note.title}</h2><br />
        <p>
          {showFormattedDate(note.createdAt)}
        </p><br />
        <p>
          {note.body}
        </p><br />
        <button type="button" onClick={handleArchive}>
          {note.archived 
          ? 'Batal Arsip' 
          : 'Arsipkan'
          }
        </button>
        <button type="button" onClick={handleDelete}>
          Hapus
        </button>
        <br /><br />
        <Link to={note.archived ? '/archive' : '/'}>
        Kembali
        </Link>
      </article>
    );
  }

  function AddNotePage({ onAddNote }) {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const handleSubmit = (event) => { 
      event.preventDefault(); 
      if (!title.trim() || !body.trim()) { alert('Judul dan isi catatan harus diisi.'); 
        return; 
      }
      onAddNote({ 
        title, 
        body, 
      }); 
      navigate('/'); 
    };

    return (
      <section>
        <h2>Tambah Catatan</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title"> Judul </label>
            <br />
            <input id="title" type="text" value={title} maxLength="50" onChange={(event) => setTitle(event.target.value) } placeholder="Masukkan judul" />
            <p> {title.length}/50 </p>
          </div>
          <div>
            <label htmlFor="body"> Isi Catatan </label>
            <br />
            <textarea id="body" value={body} onChange={(event) => setBody(event.target.value) } placeholder="Masukkan isi catatan" />
          </div>
          <br />
          <button type="submit"> Simpan Catatan </button>
        </form>
        <br />
        <Link to="/"> Kembali </Link>
      </section>
    );
  }

  function ArchivePage ({
    notes, 
    onDelete, 
    onUnarchive,
  }) {
    const archivedNotes = notes.filter( 
      (note) => note.archived
    );

    return (
      <section>
        <h2>Arsip Catatan</h2>
        {archivedNotes.length === 0 ? ( 
          <p>Arsip kosong</p> 
        ) : (
          <div>
            {archivedNotes.map((note) => (
              <article key={note.id} className="note-item">
                <h3>
                  <Link to={`/notes/${note.id}`}> {note.title} </Link>
                </h3>
                <p> {showFormattedDate(note.createdAt)} </p>
                <p>{note.body}</p>
                <button type="button" onClick={() => onUnarchive(note.id) }>
                  Batal Arsip
                </button>
                <button type="button" onClick={() => onDelete(note.id) }>
                  Hapus
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }
  function NotFoundPage() {
    return (
      <section>
        <h2>404</h2>
        <p> Halaman yang kamu cari tidak ditemukan. </p>
        <Link to="/"> Kembali ke halaman utama </Link>
      </section>
    );
  }

}

export default App;