import asyncio
from dotenv import load_dotenv
from google import genai
from app import main

async def run():
    load_dotenv()

    if not main.gemini_is_configured():
        print("FAIL: Gemini configuration is missing.")
        return

    client = genai.Client(
        api_key=main.GEMINI_API_KEY,
        http_options={"timeout": 60000},
    )

    try:
        print("Model:", main.GEMINI_MODEL)
        print("Testing with a 60-second client timeout...")

        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents="Reply with exactly: Gemini is working",
                config={"max_output_tokens": 30},
            ),
            timeout=65,
        )

        if response.text:
            print("SUCCESS: Gemini returned a response.")
            print("Response:", response.text[:200])
        else:
            print("FAIL: Gemini returned an empty response.")

    except Exception as exc:
        print("Error type:", type(exc).__name__)
        print("API status:", getattr(exc, "code", "not provided"))
        print("Detail:", str(exc)[:800])

    finally:
        await client.aio.aclose()

asyncio.run(run())

