# Phase 0 Merge Specification: Canonical Chat Engine

## 1. Feature Gap Matrix

| Feature / Subsystem | Edge Function (`universal_console_v2.ts`) | Next.js Path (`route.ts` + tools) | Status | Notes / Differences |
| :--- | :--- | :--- | :--- | :--- |
| **Tool Calling / Functions** | ❌ None (RegEx string parsing only) | ✅ Native LLM Function Calling | NEXTJS_ONLY | Next.js implements recursive `runChatRound` for tools. |
| **Provider / Tier Routing** | ❌ Hardcoded Gemini/Deepseek | ✅ Multi-provider via `ProviderManager` | NEXTJS_ONLY | Next.js uses `llm_config` and user tiers. |
| **Carrot Engine (Follow-ups)**| ❌ None | ✅ Follow-up generator prompt | NEXTJS_ONLY | Next.js runs secondary LLM call post-stream. |
| **File Attachments** | ❌ None | ✅ `processFileAttachments` | NEXTJS_ONLY | Next.js injects verified V2 documents into context. |
| **Soul Forge Integration** | ❌ None | ✅ Dynamic tool injection | NEXTJS_ONLY | Next.js adds generation tools if `isMotherOfSouls`. |
| **Web Search** | ❌ None | ✅ `search_tools.ts` | NEXTJS_ONLY | Next.js uses Tavily for web search via tools. |
| **Mood State Persistence** | ✅ DB (`persona_mood_state`) | ❌ Stateless logic (`mood.ts`) | EDGE_ONLY | Edge persists social battery/melancholy across sessions. |
| **Profile Graph (Brain)** | ✅ Background LLM Extraction | ❌ None | EDGE_ONLY | Edge extracts entities to `user_profile_graph`. |
| **Episodic Memory Layer** | ✅ Groups by `memories_episodes` | ❌ None | EDGE_ONLY | Edge groups chat into topic/time domains. |
| **Cognitive Drift System** | ✅ Prompt Injection | ❌ None | EDGE_ONLY | Randomly injects self-correction instructions. |
| **Topic Exhaustion Detection**| ✅ Break Suggestion Logic | ❌ None | EDGE_ONLY | Detects long sessions on technical topics. |
| **Cross-Persona Handoff** | ✅ Context from recent chats | ❌ None | EDGE_ONLY | Acknowledges what user just talked about with others. |
| **Multi-Persona Collaboration**| ✅ Processes `persona_ids` array | ❌ Single Persona Only | EDGE_ONLY | Edge runs memory & state loops for multiple personas. |
| **User Persona Settings** | ✅ Fetches personalization | ❌ None | EDGE_ONLY | Edge uses `persona_user_settings` table. |
| **Rate Limiting** | ✅ DB-based (`user_limits`) | ✅ Redis-based (`rateLimit`) | BOTH | Edge uses DB for daily limits; Next.js uses Redis for IPs. |
| **Memory Retrieval** | ✅ Hybrid (`match_memories_v3`) | ✅ Vector (`match_memories_v2`) | BOTH | Edge uses v3 + episodes; Next.js uses v2 + tool calls. |
| **Locket / Facts Update** | ✅ RegEx (`[SAVE_LOCKET:]`) | ✅ Tool Call (`update_locket`) | BOTH | Edge relies on text parsing; Next.js relies on JSON schemas. |
| **System Prompt Building** | ✅ Inline manual builder | ✅ `console-adapter.ts` builder | BOTH | Both construct massive context blocks. |

---

## 2. Porting EDGE_ONLY Features to Node.js (Canonical Engine)

Since the latency benchmark indicated **PATH B** (moving logic to the Next.js server), the Canonical Engine will be built in Node.js. The following Edge features must be ported:

1. **Mood State Persistence**:
   - **Equivalent**: Integrate `mood.ts` with `persistence.ts`. Add DB calls to fetch/update `persona_mood_state` inside the `POST` handler of `route.ts`.
2. **Brain Layer & Profile Graph Extraction**:
   - **Equivalent**: Port `processBrainExtraction` into a standalone Node.js utility function. Use Next.js `waitUntil()` (from `@vercel/functions`) to run the extraction asynchronously after the response stream closes, preventing latency overhead.
3. **Episodic Memory Management**:
   - **Equivalent**: Port `getOrCreateEpisode` into `persistence.ts`. Map `episode_id` when calling `saveMessage`.
4. **Cognitive Drift & Topic Exhaustion**:
   - **Equivalent**: Move the `shouldTriggerCognitiveDrift` and `checkTopicExhaustion` logic into `console-adapter.ts` so they are automatically injected into the unified system prompt.
5. **Cross-Persona Handoff Protocol**:
   - **Equivalent**: Move `getHandoffContext` into `console-adapter.ts`.
6. **User Personalization Settings**:
   - **Equivalent**: Move `getUserPersonaSettings` into `console-adapter.ts`.
7. **Multi-Persona Collaboration**:
   - **Equivalent**: Refactor `route.ts` to accept an array of `persona_ids`. The tool loop and context builder will need to iterate over personas, similar to the Edge implementation, aggregating context.
8. **RegEx Post-Processing**:
   - **Equivalent**: Deprecate the RegEx approach `[SAVE_FACT: ...]` in favor of migrating those actions into native LLM Tool Calls (e.g., expanding `locket-tools.ts` to handle facts), or implement a stream transformer in Node.js that regex-replaces the chunks on the fly if tool calling is unreliable.

---

## 3. Porting NEXTJS_ONLY Features to the Canonical Engine

The Next.js route currently possesses the most modern architecture (Tool Calling, multi-provider, streaming). However, to make it truly "Canonical" and prevent `route.ts` from becoming a 2000-line monolith, the following refactoring is required:

1. **Tool Calling Loop (`runChatRound`)**:
   - **Action**: Extract the recursive tool execution loop out of `route.ts` into a dedicated `ChatOrchestrator` or `ToolRunner` class.
2. **Provider/Tier Routing**:
   - **Action**: Already well-abstracted in `createProviderManager`. Keep this structure.
3. **Carrot Engine**:
   - **Action**: Keep in `carrot.ts`, but trigger it via a standardized event/hook system (e.g., `onStreamComplete`) rather than inline `setTimeout` inside the route.
4. **File Attachment Context**:
   - **Action**: Extract `processFileAttachments` into a `ContextBuilder` pipeline that merges System Prompts, Memories, and Files cleanly before sending to the Provider Manager.
5. **Dynamic Tool Registries**:
   - **Action**: Standardize how tools like `SOUL_FORGE_TOOLS` and `SEARCH_TOOLS` are injected based on Persona configuration or user tier, rather than hardcoding `isMotherOfSouls` checks in the main route.

---

## 4. Deno APIs Requiring Node.js Equivalents

When porting the 1208-line Deno Edge Function to Node.js, watch out for these API differences:

- **Environment Variables**:
  - *Deno*: `Deno.env.get('VAR')`
  - *Node.js*: `process.env.VAR`
- **HTTP Server Framework**:
  - *Deno*: `serve(async (req) => ...)` from `https://deno.land/std/http/server.ts`
  - *Node.js*: Standard Next.js Route Handlers (`export async function POST(request: NextRequest)`) using the `Response` object.
- **Third-Party Imports**:
  - *Deno*: URL imports `https://esm.sh/@supabase/supabase-js@2`
  - *Node.js*: NPM imports `import { createClient } from '@supabase/supabase-js'`
- **Streams**:
  - Both environments fully support the Web Streams API (`ReadableStream`, `TextEncoder`), so stream implementations port 1:1 without modification.
