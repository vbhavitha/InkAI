import os

from dotenv import load_dotenv


load_dotenv()


class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")

    # AI configuration
    AI_PROVIDER = os.getenv(
        "AI_PROVIDER",
        "gemini",
    )

    AI_MODEL = os.getenv(
        "AI_MODEL"
    )

    AI_API_KEY = os.getenv(
        "AI_API_KEY"
    )


settings = Settings()