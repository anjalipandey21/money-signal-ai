# MoneySignal AI Agent Instructions

Before making any code changes, read:

`docs/CODEX_SOURCE_OF_TRUTH.md`

That file is the source of truth for:
- product direction
- architecture rules
- completed priorities
- current roadmap
- backend/frontend conventions
- security constraints
- validation commands

Follow it unless the user explicitly gives a newer instruction in chat.

Key rules:
- Keep MoneySignal AI original.
- Use TradeSignal only as an architectural/style reference.
- Do not copy TradeSignal code, text, or branding.
- Keep `/api/v1` as the canonical API prefix.
- Do not expose secrets.
- Do not change schema or migrations unless explicitly required.
- Do not reintroduce `Base.metadata.create_all()` in app startup.
- Make small, focused changes.
- Validate before summarizing.