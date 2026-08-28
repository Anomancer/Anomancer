# Runtime profiles, Model Router and Tool Broker

These layers separate logical agent intent from physical providers and external side effects.

## Runtime profiles

Workspace-scoped runtime profiles choose enabled state, budget ceilings and an allowed model target. A profile cannot widen an Agent Contract or Model Route. Orchestration freezes effective profiles into the signed runtime snapshot.

## Model Router

Agent contracts reference logical routes such as research, writer and critic. The Model Router selects only configured targets allowed by that route and its required capabilities. Provider secrets and fallback internals stay server-side.

The current router supports DeepSeek, OpenAI, Anthropic and Gemini targets. Availability is configuration-dependent.

## Tool Broker

Tools are registry-defined capabilities. Agent requests pass through the Tool Broker and Policy Gate before execution. The broker evaluates agent contract, workspace, orchestra/run context and tool policy.

A tool result is untrusted external data. Tool access does not imply permission to publish, write a repository or release production.

## Receipts

Run metadata records selected route/target and tool/policy facts without exposing provider secrets or raw hidden prompts in the public surface.

Historical lineage incorporated from `MODEL_ROUTER.md`, `SERVER_RUNTIME_PROFILES.md` and `TOOL_BROKER.md`.
