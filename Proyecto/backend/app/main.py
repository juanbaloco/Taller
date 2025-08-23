from fastapi import FastAPI
from app.api.routes import books
from app.core.config import setup_cors


app = FastAPI(
    title = "API de Gestión de Libros",
    description = "Una API simple para gestionar una colección de libros.",
    version = "2.0.0"
)

setup_cors(app)
app.include_router(books.router, tags= ["Libros"])


@app.get("/")
def read_root():
    return {"message": "bienvenido a la API de gestión de libros"}
@app.get("/health")

def health_check():
    return {"status": "ok"}