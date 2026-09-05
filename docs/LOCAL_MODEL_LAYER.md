# Local Model Layer

Lighthouse supports OpenAI-compatible local model servers through the `qwen-local` target family.

## Environment

```bash
export QWEN_LOCAL_BASE_URL=http://127.0.0.1:11434/v1
export QWEN_LOCAL_MODEL=qwen3
```

Optional per-route model variables:

```bash
QWEN_LOCAL_RESEARCH_MODEL=qwen3
QWEN_LOCAL_WRITER_MODEL=qwen3
QWEN_LOCAL_CRITIC_MODEL=qwen3
```

The local server must expose `POST /v1/chat/completions` with OpenAI-compatible JSON responses. No API key is required by the Lighthouse adapter.

Local targets are provider targets inside the same Model Router contract. Agents remain provider-agnostic, and publication remains human-gated.
