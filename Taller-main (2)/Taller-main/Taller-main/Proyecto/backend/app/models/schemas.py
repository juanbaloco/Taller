from pydantic import BaseModel, Field
from typing import Optional

class BookBase(BaseModel):
    title: str = Field(..., example="The Great Gatsby")
    author: str = Field(..., example="F. Scott Fitzgerald")
    year: int = Field(..., example=1925)
    read: bool = False

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    year: Optional[int] = None
    read: Optional[bool] = None

class Book(BookBase):
    id: int = Field(..., example=1)

    class Config:
        from_attributes = True