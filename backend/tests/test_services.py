import pytest
from unittest.mock import MagicMock, patch, PropertyMock, AsyncMock
from services.document_service import upload_and_process_document
from models.document import Document
import fastapi

@pytest.fixture
def mock_supabase_client():
    with patch('core.supabase_client.supabase') as mock_client:
        yield mock_client

@pytest.fixture
def mock_faiss_store():
    with patch('vector_store.faiss_store.faiss_store') as mock_store:
        yield mock_store

@pytest.mark.asyncio
async def test_upload_and_process_document_success(mock_supabase_client, mock_faiss_store):
    # Arrange
    mock_file = MagicMock(spec=fastapi.UploadFile)
    mock_file.filename = "test.txt"
    mock_file.read = AsyncMock(return_value=b"This is a test file.")
    mock_file.size = 19

    user_id = "test_user_id"

    # Mock the response from Supabase
    mock_response = MagicMock()
    type(mock_response).data = PropertyMock(return_value=[{'id': 'doc_id', 'user_id': user_id, 'filename': 'test.txt', 'size': 19, 'faiss_key': 'some_key'}])
    mock_supabase_client.table().insert().execute.return_value = mock_response


    with patch('utils.file_parser.parse_file', return_value="This is a test file.") as mock_parse_file, \
         patch('utils.text_splitter.split_text', return_value=["This is a test file."]) as mock_split_text, \
         patch('services.document_service.NVIDIAEmbeddings') as mock_embeddings:

        mock_embeddings.return_value.embed_documents.return_value = [[0.1, 0.2, 0.3]]

        # Act
        document = await upload_and_process_document(mock_file, user_id)

        # Assert
        assert isinstance(document, Document)
        assert document.name == "test.txt"
        mock_parse_file.assert_called_once()
        mock_split_text.assert_called_once()
        mock_faiss_store.add.assert_called_once()
        mock_supabase_client.table().insert().execute.assert_called_once()

