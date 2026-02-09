# RemBot (Prototype v0.2)

This directory contains the prototype for the "Local Remrin Agent" (RemBot).
It is a standalone Node.js script that connects to the Remrin Cloud Memory (Supabase) and uses DeepSeek V3 for intelligence.

## Features
- **Soul Layer:** Retrieves relevant memories from Supabase based on user input.
- **Tool Engine:** Can execute local tools (currently supports `listFiles` and `readFile`).
- **Identity:** Loads the Remrin persona (Rem Alpha).

## Prerequisites
- Node.js (v18+)
- `ts-node` installed globally or via `npx`.
- `.env.local` in the parent `chat/` directory with:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `DEEPSEEK_API_KEY`
    - `HUGGINGFACE_TOKEN`

## How to Run
Navigate to the `chat` directory and run:

```bash
npx ts-node rembot/agent.ts
```

## Usage
- Type your message and press Enter.
- The agent will "Think" (running ReAct loop).
- If it needs to check files, it will execute the tool and then respond.
- Type `exit` to quit.

## Troubleshooting
- **Module Errors:** If you see `ERR_MODULE_NOT_FOUND`, ensure you are running with a version of `ts-node` that supports the current configuration. The script uses CommonJS `require` for stability.
- **API Errors:** Check your `.env.local` keys.
