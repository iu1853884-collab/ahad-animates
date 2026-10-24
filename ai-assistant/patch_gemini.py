from pathlib import Path

p = Path("app/main.py")
source = p.read_text(encoding="utf-8")

old_import = '''from openai import (
    APIError,
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
    RateLimitError,
)'''
new_import = '''from google import genai
from google.genai import errors as gemini_errors
import asyncio'''

old_config = '''OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "").strip()'''
new_config = '''GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()'''

old_config_fn = '''def openai_is_configured() -> bool:
    return bool(
        OPENAI_API_KEY
        and OPENAI_MODEL
        and OPENAI_API_KEY.casefold() != "your-openai-api-key-here"
    )'''
new_config_fn = '''def gemini_is_configured() -> bool:
    return bool(
        GEMINI_API_KEY
        and GEMINI_MODEL
        and GEMINI_API_KEY.casefold() != "your-gemini-api-key-here"
    )'''

old_function_start = '''async def request_ai_answer(
    payload: ChatRequest, projects: list[PortfolioProject]
) -> str:
    client = AsyncOpenAI(api_key=OPENAI_API_KEY, timeout=20.0, max_retries=0)'''
new_function_start = '''async def request_ai_answer(
    payload: ChatRequest, projects: list[PortfolioProject]
) -> str:
    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options={"timeout": 20000},
    )'''

checks = [
    (old_import, new_import, "OpenAI imports"),
    (old_config, new_config, "OpenAI configuration"),
    (old_config_fn, new_config_fn, "configuration helper"),
    (old_function_start, new_function_start, "AI request function"),
]
for old, new, label in checks:
    if source.count(old) != 1:
        raise SystemExit(f"STOP: expected exactly one {label} section; no changes applied.")

health_old = "\"assistant_configured\": openai_is_configured()"
if source.count(health_old) < 1:
    raise SystemExit("STOP: health configuration reference did not match.")

chat_old = "if not openai_is_configured():"
if source.count(chat_old) != 1:
    raise SystemExit("STOP: chat configuration reference did not match.")

# Replace provider error handling as one exact, verified block.
error_old = '''    except APITimeoutError:
        raise HTTPException(
            status_code=504,
            detail="The AI service took too long to respond. Please retry.",
        ) from None
    except RateLimitError:
        raise HTTPException(
            status_code=503,
            detail="The AI provider is temporarily rate limited. Please retry shortly.",
        ) from None
    except APIConnectionError:
        raise HTTPException(
            status_code=503,
            detail="The AI provider is temporarily unreachable. Please retry shortly.",
        ) from None
    except APIStatusError as error:
        status_code = 503 if error.status_code in (401, 403, 429) else 502
        message = (
            "The AI provider is not available with the current configuration."
            if status_code == 503
            else "The AI provider could not complete this request. Please retry."
        )
        raise HTTPException(status_code=status_code, detail=message) from None
    except APIError:
        raise HTTPException(
            status_code=502,
            detail="The AI provider could not complete this request. Please retry.",
        ) from None'''

error_new = '''    except (TimeoutError, asyncio.TimeoutError):
        raise HTTPException(
            status_code=504,
            detail="The AI service took too long to respond. Please retry.",
        ) from None
    except gemini_errors.APIError as error:
        code = getattr(error, "code", 0)
        if code == 429:
            raise HTTPException(
                status_code=503,
                detail="The AI provider is temporarily rate limited. Please retry shortly.",
            ) from None
        if code in (401, 403):
            raise HTTPException(
                status_code=503,
                detail="The AI provider is not available with the current configuration.",
            ) from None
        raise HTTPException(
            status_code=502,
            detail="The AI provider could not complete this request. Please retry.",
        ) from None
    except Exception:
        # Never return provider internals, credentials, or request details.
        raise HTTPException(
            status_code=502,
            detail="The AI provider could not complete this request. Please retry.",
        ) from None'''

if source.count(error_old) != 1:
    raise SystemExit("STOP: provider error block did not match; no changes applied.")

function_end_old = '''    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=600,
            temperature=0.2,
        )
    finally:
        await client.close()
    choice = response.choices[0].message.content if response.choices else None
    return choice.strip() if choice else ""'''

function_end_new = '''    prompt = (
        messages[0]["content"]
        + "\\n\\n"
        + messages[1]["content"]
    )
    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config={
                    "temperature": 0.2,
                    "max_output_tokens": 600,
                },
            ),
            timeout=20.0,
        )
    finally:
        await client.aio.aclose()

    answer = getattr(response, "text", None)
    return answer.strip() if answer else ""'''

if source.count(function_end_old) != 1:
    raise SystemExit("STOP: Gemini request replacement did not match; no changes applied.")

updated = source
for old, new, _ in checks:
    updated = updated.replace(old, new, 1)
updated = updated.replace(health_old, "\"assistant_configured\": gemini_is_configured()", 1)
updated = updated.replace(chat_old, "if not gemini_is_configured():", 1)
updated = updated.replace(error_old, error_new, 1)
updated = updated.replace(function_end_old, function_end_new, 1)

# Ensure no active OpenAI integration remains.
if "AsyncOpenAI" in updated or "OPENAI_API_KEY" in updated or "OPENAI_MODEL" in updated:
    raise SystemExit("STOP: unexpected OpenAI reference remains; no changes applied.")

backup = p.with_name("main.py.pre-gemini-patch")
backup.write_text(source, encoding="utf-8")
p.write_text(updated, encoding="utf-8")
print("Gemini provider patch applied.")
print(f"Pre-patch backup: {backup}")



