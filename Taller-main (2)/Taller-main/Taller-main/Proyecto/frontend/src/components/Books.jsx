import React, { useState, useEffect, useCallback } from 'react';
import { apiGetList, apiCreateBook, apiUpdateBook, apiDeleteBook, apiGetStats } from '../api';

const PAGE_SIZE = 10;

const Books = () => {
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: '',
    read: false
  });
  const [editingId, setEditingId] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch books with filters
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const offset = (currentPage - 1) * PAGE_SIZE;
      const params = {
        q: debouncedSearch || undefined,
        sort: sortBy,
        order: sortOrder,
        offset,
        limit: PAGE_SIZE
      };

      const { data, total } = await apiGetList('/books', params);
      setBooks(data);
      setTotalBooks(total);
      
    } catch (err) {
      setError(`Error al cargar libros: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, sortOrder, currentPage]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiGetStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Load data
  useEffect(() => {
    fetchBooks();
    fetchStats();
  }, [fetchBooks, fetchStats]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      if (editingId) {
        await apiUpdateBook(editingId, formData);
        setEditingId(null);
      } else {
        await apiCreateBook(formData);
      }
      
      setFormData({ title: '', author: '', year: '', read: false });
      fetchBooks();
      fetchStats();
      
    } catch (err) {
      setError(`Error al guardar: ${err.message}`);
      console.error('Save error:', err);
    }
  };

  // Handle edit
  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      year: book.year,
      read: book.read
    });
    setEditingId(book.id);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setFormData({ title: '', author: '', year: '', read: false });
    setEditingId(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este libro?')) {
      return;
    }

    try {
      setError('');
      await apiDeleteBook(id);
      
      // Adjust page if we deleted the last item on the page
      if (books.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchBooks();
      }
      fetchStats();
      
    } catch (err) {
      setError(`Error al eliminar: ${err.message}`);
      console.error('Delete error:', err);
    }
  };

  // Toggle read status
  const toggleReadStatus = async (book) => {
    try {
      setError('');
      await apiUpdateBook(book.id, { read: !book.read });
      fetchBooks();
      fetchStats();
    } catch (err) {
      setError(`Error al actualizar: ${err.message}`);
      console.error('Toggle error:', err);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalBooks / PAGE_SIZE);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Handle page navigation
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading && books.length === 0) {
    return <div className="loading">Cargando libros...</div>;
  }

  return (
    <div className="books-container">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-sort">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar libros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="title">Título</option>
              <option value="author">Autor</option>
              <option value="year">Año</option>
            </select>
            
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="order-select"
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="stats-btn"
          >
            {showStats ? 'Ocultar Stats' : 'Ver Stats'}
          </button>
        </div>

        {showStats && stats && (
          <div className="stats-panel">
            <h3>📊 Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{stats.Count}</span>
                <span className="stat-label">Total libros</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.read_count}</span>
                <span className="stat-label">Leídos</span>
              </div>
              <div className="stat-item">
                <span className="stat-text">{stats.top_author || 'N/A'}</span>
                <span className="stat-label">Autor top</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Form */}
      <form onSubmit={handleSubmit} className="book-form">
        <h3>{editingId ? 'Editar Libro' : 'Nuevo Libro'}</h3>
        
        <div className="form-grid">
          <input
            type="text"
            name="title"
            placeholder="Título *"
            value={formData.title}
            onChange={handleInputChange}
            required
            minLength="1"
          />
          
          <input
            type="text"
            name="author"
            placeholder="Autor *"
            value={formData.author}
            onChange={handleInputChange}
            required
            minLength="1"
          />
          
          <input
            type="number"
            name="year"
            placeholder="Año *"
            value={formData.year}
            onChange={handleInputChange}
            required
            min="1500"
            max="2100"
          />
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="read"
              checked={formData.read}
              onChange={handleInputChange}
            />
            Leído
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="btn-secondary">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Books List */}
      <div className="books-section">
        <div className="section-header">
          <h2>Biblioteca ({totalBooks} libros)</h2>
          {loading && <span className="loading-indicator">🔄 Actualizando...</span>}
        </div>

        {books.length === 0 ? (
          <div className="empty-state">
            {debouncedSearch ? 'No se encontraron libros' : 'No hay libros en la biblioteca'}
          </div>
        ) : (
          <>
            <div className="books-grid">
              {books.map(book => (
                <div key={book.id} className={`book-card ${book.read ? 'read' : ''}`}>
                  <div className="book-header">
                    <h3>{book.title}</h3>
                    <span className="book-status">
                      {book.read ? '✅' : '📖'}
                    </span>
                  </div>
                  
                  <div className="book-details">
                    <p><strong>Autor:</strong> {book.author}</p>
                    <p><strong>Año:</strong> {book.year}</p>
                  </div>

                  <div className="book-actions">
                    <button
                      onClick={() => toggleReadStatus(book)}
                      className={`btn-toggle ${book.read ? 'read' : 'unread'}`}
                    >
                      {book.read ? 'No leído' : 'Leído'}
                    </button>
                    <button
                      onClick={() => handleEdit(book)}
                      className="btn-edit"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="btn-delete"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!canGoPrevious}
                  className="pagination-btn"
                >
                  ← Anterior
                </button>

                <span className="page-info">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!canGoNext}
                  className="pagination-btn"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Books;