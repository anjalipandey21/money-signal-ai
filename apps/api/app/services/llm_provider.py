import json
import os
from typing import Any


class LLMProviderError(Exception):
    pass


def get_llm_provider() -> str:
    return os.getenv("LLM_PROVIDER", "template").lower()


def build_money_signal_prompt(company_payload: dict[str, Any]) -> str:
    return f"""
You are an AI financial research assistant for MoneySignal AI.

Important rules:
- Do not give buy/sell recommendations.
- Do not predict stock prices.
- Do not say the user should invest.
- Explain public money-movement signals in simple language.
- Keep output concise and practical.
- Return only valid JSON.

Company and signal data:
{json.dumps(company_payload, default=str, indent=2)}

Return JSON with exactly these keys:
{{
  "summary": "...",
  "why_it_matters": "...",
  "watch_next": "...",
  "limitations": "This is a research signal, not financial advice."
}}
"""


def parse_json_response(text: str) -> dict[str, str]:
    try:
        data = json.loads(text)

        return {
            "summary": data.get("summary", "").strip(),
            "why_it_matters": data.get("why_it_matters", "").strip(),
            "watch_next": data.get("watch_next", "").strip(),
            "limitations": data.get(
                "limitations",
                "This is a research signal, not financial advice.",
            ).strip(),
        }

    except json.JSONDecodeError as error:
        raise LLMProviderError(f"LLM returned invalid JSON: {error}") from error


def generate_with_openai(prompt: str) -> dict[str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-5.5")

    if not api_key:
        raise LLMProviderError("OPENAI_API_KEY is missing")

    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    response = client.responses.create(
        model=model,
        instructions=(
            "You generate concise JSON explanations for financial research signals. "
            "Never provide financial advice."
        ),
        input=prompt,
    )

    return parse_json_response(response.output_text)


def generate_with_gemini(prompt: str) -> dict[str, str]:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    if not api_key:
        raise LLMProviderError("GEMINI_API_KEY is missing")

    from google import genai

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model,
        contents=prompt,
    )

    return parse_json_response(response.text)


def generate_llm_explanation(company_payload: dict[str, Any]) -> dict[str, str]:
    provider = get_llm_provider()
    prompt = build_money_signal_prompt(company_payload)

    if provider == "openai":
        return generate_with_openai(prompt)

    if provider == "gemini":
        return generate_with_gemini(prompt)

    raise LLMProviderError(f"Unsupported LLM_PROVIDER: {provider}")