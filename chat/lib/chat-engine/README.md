# Remrin Chat Engine v2

The Remrin Chat Engine v2 is a modular, tier-based chat system designed to replace the legacy ChatbotUI implementation. It provides a flexible architecture for integrating multiple LLM providers and extending chat capabilities.

## Architecture Overview

The engine is built around a central `ProviderManager` that handles:
- **Tier-based Routing**: Automatically selects the appropriate provider based on the user's subscription tier (`free`, `pro`, `premium`, `enterprise`).
- **Unified Interface**: All providers implement the `IChatProvider` interface, ensuring consistent message handling and streaming.
- **Modular Capabilities**: Extendable features like web search, file processing, and proactive AI behaviors (Carrot Engine).

## Providers

| Provider | ID | Default Model | Environment Variable | Tier |
|----------|----|---------------|----------------------|------|
| **OpenRouter** | `openrouter` | `mistralai/mistral-7b-instruct:free` | `OPENROUTER_API_KEY` | Free |
| **DeepSeek** | `deepseek` | `deepseek-chat` | `DEEPSEEK_API_KEY` | Pro+ |
| **Claude** | `claude` | `claude-3-5-sonnet-20241022` | `ANTHROPIC_API_KEY` | Pro+ |
| **Gemini** | `gemini` | `gemini-1.5-flash` | `GOOGLE_GEMINI_API_KEY` | Premium+ |
| **Custom** | `custom` | *User Defined* | *User Defined* | Enterprise |

## Tier System

- **Free**: Restricted to OpenRouter (Free models) and basic search.
- **Pro**: Access to DeepSeek, Claude, and full file/search capabilities.
- **Premium**: Adds Gemini support and advanced reasoning features.
- **Enterprise**: Custom providers and unlimited rate limits.

## How to Add a New Provider

1. **Implement Interface**: Create a new file in `lib/chat-engine/providers/[provider].ts` and implement the `IChatProvider` interface.
2. **Update Types**: Add your provider ID to the `ProviderId` type and its configuration to `PROVIDER_CONFIGS` in `lib/chat-engine/types.ts`.
3. **Register**: Add the new provider instance to the `ProviderManager` in `lib/chat-engine/providers/index.ts`.

## How to Add a New Capability

1. **Implement Capability**: Create a new class implementing `IChatCapability` in `lib/chat-engine/capabilities/`.
2. **Define Logic**: Implement `preProcess` (for augmenting prompts) and `postProcess` (for refining responses) methods.
3. **Integrate**: Add the capability ID to `CapabilityId` in `types.ts` and update the relevant API routes to utilize the new capability.
