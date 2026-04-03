import os
import pdfplumber
from docx import Document as DocxDocument

def parse_file(file_path: str) -> str:
    """
    Extracts text from a file based on its extension.
    Supports PDF, DOCX, and TXT files.
    """
    _, extension = os.path.splitext(file_path)
    
    if extension.lower() == ".pdf":
        return parse_pdf(file_path)
    elif extension.lower() == ".docx":
        return parse_docx(file_path)
    elif extension.lower() == ".txt":
        return parse_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {extension}")

def parse_pdf(file_path: str) -> str:
    """Extracts text from a PDF file."""
    with pdfplumber.open(file_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def parse_docx(file_path: str) -> str:
    """Extracts text from a DOCX file."""
    doc = DocxDocument(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def parse_txt(file_path: str) -> str:
    """Extracts text from a TXT file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()
