"""
Title Generation Service - Creates smart titles from user messages
"""

from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage
from core.config import settings
import re


async def generate_chat_title(user_message: str) -> str:
    """
    Generate a concise, relevant title from the user's first message.
    Examples:
    - "what is machine learning" → "Machine Learning Overview"
    - "help me with React components" → "React Components Help"
    - "python tutorial for beginners" → "Python Tutorial"
    """

    # Clean and truncate input
    clean_message = user_message.strip()[:200]

    # Quick fallback for very short messages
    if len(clean_message) < 3:
        return "Quick Chat"

    # System prompt for title generation
    system_prompt = """Generate a SHORT, descriptive title (2-4 words) for this chat based on the user's message.

Rules:
- Keep it under 25 characters
- Use title case (capitalize first letters)
- Be specific but concise
- Focus on the main topic
- No quotes, no "Chat about", no "Discussion"

Examples:
"what is machine learning" → "Machine Learning"
"help with React hooks" → "React Hooks Help"
"python coding tutorial" → "Python Tutorial"
"how to cook pasta" → "Cooking Pasta"
"debugging javascript errors" → "JavaScript Debug"

Generate ONLY the title, nothing else:"""

    try:
        # Use LLM to generate title
        llm = ChatNVIDIA(
            model=settings.LLM_MODEL,
            api_key=settings.NVIDIA_NIM_API_KEY,
            temperature=0.3,  # Lower temperature for more consistent titles
            max_tokens=20,    # Keep titles short
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=clean_message)
        ]

        response = llm.invoke(messages)
        generated_title = response.content.strip()

        # Clean up the generated title
        title = clean_generated_title(generated_title)

        # Final validation
        if len(title) > 30 or len(title) < 2:
            return create_fallback_title(user_message)

        return title

    except Exception as e:
        print(f"Title generation failed: {e}")
        return create_fallback_title(user_message)


def clean_generated_title(title: str) -> str:
    """Clean and validate generated title"""
    # Remove quotes, extra spaces, weird characters
    title = re.sub(r'["""''`]', '', title)
    title = re.sub(r'\s+', ' ', title).strip()

    # Remove common prefixes
    prefixes_to_remove = [
        "chat about", "discussion about", "help with", "question about",
        "topic:", "title:", "about", "regarding"
    ]

    title_lower = title.lower()
    for prefix in prefixes_to_remove:
        if title_lower.startswith(prefix):
            title = title[len(prefix):].strip()
            break

    # Ensure proper title case
    title = title.title()

    return title


def create_fallback_title(message: str) -> str:
    """Create a simple fallback title from keywords"""
    # Extract key words (remove common words)
    words = re.findall(r'\b[A-Za-z]{3,}\b', message.lower())
    stop_words = {'what', 'how', 'can', 'you', 'help', 'with', 'the', 'and', 'for', 'about'}
    key_words = [w.title() for w in words if w not in stop_words][:2]

    if key_words:
        return ' '.join(key_words)
    else:
        return "New Chat"