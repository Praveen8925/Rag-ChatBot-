from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # NVIDIA NIM
    NVIDIA_NIM_API_KEY: str
    LLM_BASE_URL: str
    LLM_MODEL: str
    EMBED_API_KEY: str
    EMBED_BASE_URL: str
    EMBED_MODEL: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str

    # Application
    FRONTEND_URL: str

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
