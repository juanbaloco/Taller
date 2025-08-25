from fastapi import APIRouter, HTTPException, Header,Response
from typing import List, Optional
from app.models.schemas import Book ,BookCreate, BookUpdate

router = APIRouter()

books_db: list[Book] = []
next_id = 1

def normalize_book_key(title: str, author: str) -> tuple:
    """Normalizar el título y el autor para la comparación de duplicados."""
    return (title.lower().strip(), author.lower().strip())

def find_book_by_id(book_id: int) -> Optional[Book]:
    """encontrar un libro por su ID"""
    return next((book for book in books_db if book.id == book_id), None)

def check_duplicate_book(title: str, author: str,exclude_id: Optional[int] = None) -> bool:
    """Comprobar si un libro con el mismo título y autor ya existe."""
    key = normalize_book_key(title, author)
    for book in books_db:
        if(exclude_id is None or book.id != exclude_id) and normalize_book_key(book.title,book.author) == key:
            return True
    return False
@router.post("/books", response_model=Book, status_code=201)
def create_book(book_create: BookCreate):
    """Crear un nuevo libro"""
    global next_id

    if check_duplicate_book(book_create.title, book_create.author):
        raise HTTPException(status_code=409, detail="Un libro con el mismo título y autor ya existe")

    new_book = Book(
        id=next_id,
        title=book_create.title,
        author=book_create.author,
        year=book_create.year,
        read=book_create.read
    )
    books_db.append(new_book)
    next_id += 1
    return new_book
@router.get("/books", response_model=List[Book])
def list_books(
    response: Response,
    q: Optional[str] = None,
    sort: Optional[str] = None,
    order: Optional[str] = "asc",
    offset: int = 0,
    limit: int = 10
):
    """Listar todos los libros con opciones de filtrado, ordenación y paginación."""
    
    if sort not in ["title", "author", "year"]:
        sort = "title"
    if order not in ["asc", "desc"]:
        order = "asc"
    if limit < 1 or limit > 100:
        limit = 10
    if offset < 0:
        offset = 0

    filtered_books = books_db
    if q:
        q_lower = q.lower()
        filtered_books = [
            book for book in books_db
            if q_lower in book.title.lower() or q_lower in book.author.lower()
        ]
    reverse = (order == "desc")
    filtered_books = sorted(filtered_books, key=lambda x: getattr(x, sort), reverse=reverse)
    
    response.headers["X-Total-Count"] = str(len(filtered_books))

    paginated_books = filtered_books[offset:offset + limit]
    return paginated_books

@router.put("/books/{book_id}", response_model=Book)
def update_book(book_id: int, book_update: BookUpdate):
    """actualizar un libro existente"""
    book = find_book_by_id(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    
    update_data = book_update.dict(exclude_unset=True)

    new_title = update_data.get("title", book.title)
    new_author = update_data.get("author", book.author)

    if ("title" in update_data or "author" in update_data):
        if check_duplicate_book(new_title, new_author, exclude_id=book_id):
            raise HTTPException(status_code=409, detail="Un libro con el mismo título y autor ya existe")
    
    for field, value in update_data.items():
        setattr(book, field, value)
    return book

@router.delete("/books/{book_id}", status_code=204)
def delete_book(book_id: int):
    """Eliminar un libro por su ID"""
    book = find_book_by_id(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    books_db.remove(book)
    return 

@router.get("/books/stats")
def get_stats():
    """Obtener estadísticas sobre los libros."""
    total_books = len(books_db)
    read_books = sum(1 for book in books_db if book.read)
    
    author_counts = {}
    for book in books_db:
        author_counts[book.author] = author_counts.get(book.author, 0) + 1
    
    top_author = max(author_counts, key= author_counts.get) if author_counts else "N/A" 
     
    return {
        "Count": total_books,
        "read_count": read_books,
        "top_author": top_author
    }
