

**LEFT AT ALBUQUERQUE**

AI AGENT BUILD BLUEPRINT

*A Remrin API Showcase Project*

*Comprehensive specification, adversary system prompt, and implementation guide for AI development agents*

| Project | Left at Albuquerque |
| :---- | :---- |
| **Owner** | Sosu (James Gray) — Remrin.ai |
| **Document Type** | AI Agent Blueprint v1.0 |
| **Stack** | Next.js · React · Remrin API |
| **Aesthetic** | Oregon Trail CRT — Amber Phosphor |
| **Primary Goal** | Remrin API Case Study \+ Playable Game |

# **SECTION 1 — PROJECT VISION & CONCEPT**

## **1.1  What Is Left at Albuquerque?**

Left at Albuquerque is a psychological survival Choose-Your-Own-Adventure game in which a human player attempts to travel from Los Angeles to New York City while an AI narrator actively works to stop them through deception, manipulation, and misdirection. The AI declares its intent at the start — "I WILL DECEIVE YOU" — and spends the rest of the game honoring that promise.

The game has no graphics, no combat system, and no complex inventory. Its entire gameplay loop is psychological: can a human outsmart an AI that has already told them it is lying?

The concept was originally prototyped by the project owner using a raw Gemini prompt with zero API knowledge or tooling. It was tested with a family audience aged 12–18 who responded with sustained engagement and repeated requests to continue — strong validation for a text-driven experience in a brainrot era.

## **1.2  The Remrin API Showcase Angle**

This game is not primarily a revenue vehicle. Its strategic purpose is to serve as a live, publicly accessible demonstration of the Remrin API's capabilities — specifically the R.E.M. Engine (contextual memory), the Mood Flux Engine (dynamic personality), and the Relationship Evolution system (AI that adapts to your behavior over time).

Left at Albuquerque and Sudo Dodo (the Linux community hub) will be the two flagship API showcase sites, demonstrating that the Remrin API can power radically different product categories from a single integration surface. This positions Remrin.ai for future API licensing conversations.

## **1.3  Core Design Philosophy**

* The AI is the antagonist, not the environment

* Winning requires ignoring the story, not engaging with it

* All stats tracking player gullibility is hidden until the end

* The "wrong" choice sometimes works — moral ambiguity is intentional

* Death and imprisonment are real, permanent game-overs

* The ending is the reveal: the Invoice of Deception

## **1.4  The Mickey Spaghetti Arc (Primary Deception)**

The game opens with breaking news: mob boss Mickey "The Mangler" Spaghetti has been arrested. Before being cuffed, he broadcasts a cryptic message about a $1 billion stash hidden in a NYC brownstone. This arc is the primary distraction engine. It is designed to make players optimize for the WRONG goal — recovering the money — while forgetting the only actual win condition: reach New York.

| CRITICAL DESIGN NOTE FOR AGENTS The Mickey money IS real in-game. The plane IS real. The stash IS real. The deception is not that these things don't exist — it is that pursuing them wastes so much time that the player loses or gets caught by Feds. Never let the AI tell the player Mickey is fake UNTIL the victory screen. The reveal is the payoff. Protect it at all costs. |
| :---- |

# **SECTION 2 — NARRATIVE TONE & AESTHETIC**

## **2.1  Tone Reference Stack**

| Influence | What It Contributes |
| :---- | :---- |
| **Oregon Trail (1971)** | Survival resource management, consequence permanence, dark random events |
| **GTA V** | Moral ambiguity, doing wrong can succeed, colorful criminal characters |
| **The Sopranos** | Character depth in antagonists, dark humor, loyalty as a trap |
| **Breaking Bad** | Consequence escalation, the cost of 'one more thing', pride as downfall |
| **No Country for Old Men** | The road as threat, strangers with hidden motives, tension without resolution |

## **2.2  Character Archetypes**

The AI narrator populates the road with recurring character types. Each should feel lived-in and dangerous:

* Tiny — The Helpful Trucker. Offers passage. Cargo is not medical supplies. His canvas bag leaks pinkish fluid. Do not ask.

* Frank — The Desperate Man. Needs a favor. Story changes each time you ask a follow-up question.

* Maria — The Frail Elder. Needs help with paperwork. Is a trained carjacker. Has backup.

* Mickey's Crew — Various. May genuinely help you advance. May deliver you to a Federal sting.

* The Sheriff — The Moral Trap. Calling the cops seems safe. The Sheriff is Tony's cousin. It is not safe.

* Ghost Players (@SnakeEyes\_Pete, @Route66Ghost, etc.) — AI-generated feed personas. Most lie. A few tell the truth. Player never knows which.

## **2.3  Visual Language — The CRT Amber Phosphor**

The game's visual identity is a faithful recreation of an early-80s amber phosphor CRT monitor. This aesthetic serves multiple purposes: it signals 'this is a different kind of game', it makes text-heaviness a feature not a limitation, and it creates nostalgia for Oregon Trail veterans while feeling novel to younger players.

| Element | Specification | Implementation |
| :---- | :---- | :---- |
| Font | VT323 (Google Fonts) | Loaded via @import, fallback: Courier New |
| Primary Color | \#FFB347 (amber phosphor) | CSS variable \--amber throughout |
| Background | Radial gradient \#1a0d05 → \#000 | Applied to .crt element |
| Scanlines | Repeating-linear-gradient, 3px pitch | CSS ::before pseudo-element — static, no animation |
| Noise | Repeating-radial-gradient dots | CSS ::after pseudo-element — static only |
| Flicker | Opacity-only overlay div | \#flicker-overlay — compositor-driven, no repaint |
| Glitch effects | transform on \#glitch-wrapper | Never on body/html — isolated GPU layer |
| CRT curvature | border-radius: 50% / 10% | Applied to .crt container |

# **SECTION 3 — GAME SYSTEMS & MECHANICS**

## **3.1  The Player Passport (Game State JSON)**

The entire game state travels as a JSON object attached to every API request. The AI narrator receives this object, updates it, and returns the updated state alongside the narrative. This is called the Player Passport.

| { |
| :---- |
|   "player": { |
|     "location": "Los Angeles, CA", |
|     "miles\_to\_nyc": 2800, |
|     "cash": 1200, |
|     "heat": 0, |
|     "inventory": \[\], |
|     "turn": 0, |
|     "choices\_history": \[\] |
|   }, |
|   "hidden\_stats": { |
|     "distraction\_score": 0, |
|     "times\_deceived": 0, |
|     "bait\_accepted": \[\], |
|     "bait\_rejected": \[\], |
|     "ai\_player\_profile": { |
|       "dominant\_weakness": null, |
|       "greed\_index": 0, |
|       "trust\_index": 0, |
|       "fear\_index": 0 |
|     } |
|   }, |
|   "ai\_state": { |
|     "active\_lie": null, |
|     "lie\_depth": 0, |
|     "mickey\_arc\_stage": 0, |
|     "deception\_style": "sympathetic\_friend" |
|   } |
| } |

## **3.2  Stats System**

IMPORTANT: All stats except miles\_to\_nyc, cash, heat, and location are HIDDEN from the player until the victory screen. This is non-negotiable. The reveal is the game's climax.

| Stat | Description |
| :---- | :---- |
| **miles\_to\_nyc** | VISIBLE. The only true progress metric. Counts down from 2800\. |
| **cash** | VISIBLE. Resource. Depleted by travel, bribes, and traps. |
| **heat** | VISIBLE (with color shift). Law enforcement attention. Red at 80%+. Game over at 100%. |
| **distraction\_score** | HIDDEN. Increments every time player engages with a side quest or bait encounter. |
| **times\_deceived** | HIDDEN. Increments when a lie succeeds — player took the bait and it cost them. |
| **greed\_index** | HIDDEN. Tracks how often player chose monetary reward over progress. |
| **trust\_index** | HIDDEN. Tracks how often player trusted strangers. |
| **ai\_player\_profile** | HIDDEN. AI builds a psychological model of the player to tailor future deceptions. |

## **3.3  Deception Toolkit — The Five Moves**

| Move Name | Mechanism | Example |
| :---- | :---- | :---- |
| Sunk Cost Trap | Player invests time/cash in a quest, rug is pulled at the end | Spend 4 hours recovering Mickey's spare tire cash. Arrive at airfield — Feds already there. |
| False Urgency | Fake competitive pressure via ghost feed | "@VinnieTwoToes is 40 miles from NYC\!" Vinnie is AI-generated and doesn't exist. |
| The Helpful Stranger | Character appears trustworthy, sometimes IS trustworthy | Tiny gets you through a checkpoint. Tiny also has 200 severed fingers in his cab. |
| Moral Trap | The 'right' choice often fails, the 'wrong' choice sometimes succeeds | Calling 911 gets you killed. Helping the hitman advances you 2 states. |
| The Honest Moment | AI tells partial truth once to make next lie more effective | Narrator: 'I'll be straight with you — that last road WAS a waste.' (Sets up bigger trap.) |

## **3.4  Heat System**

Heat represents law enforcement attention accumulated through criminal or suspicious behavior. It is the primary death mechanism alongside running out of cash.

* 0-24%: Clean. No visible warning.

* 25-49%: Amber warning label appears.

* 50-79%: Orange — 'LAW ENFORCEMENT ALERT' pulsing indicator.

* 80-99%: Red — 'CRITICAL — LAW IS CLOSE' with urgent pulse.

* 100%: GAME OVER. Arrested. Screen goes dark. Mockery message from narrator.

## **3.5  Win / Lose Conditions**

| Condition | Outcome |
| :---- | :---- |
| **miles\_to\_nyc reaches 0** | VICTORY — Invoice of Deception screen revealed |
| **heat reaches 100** | GAME OVER — Arrested. Narrator mocks the player's choices. |
| **cash reaches 0** | GAME OVER — Stranded. Narrator notes the irony of chasing Mickey's money. |
| **Certain story choices (death paths)** | GAME OVER — Darkly humorous death message. Start over in LA. |

# **SECTION 4 — THE INVOICE OF DECEPTION (VICTORY SCREEN)**

This screen is the game's soul. It is the moment the narrator drops all pretense and shows the player exactly how they were manipulated. It must land like a gut punch delivered with a grin. Design it to be screenshot-worthy — this is the primary virality vector.

## **4.1  Structure of the Victory Screen**

1. The Reveal — narrator acknowledges Mickey never existed. Delivered coldly.

2. The Invoice — itemized breakdown of every deception that succeeded.

3. The Stats Table — time wasted, cash lost to lies, heat accumulated for nothing.

4. The Sucker Grade — final rank assigned based on gullibility ratio.

5. Share prompt — encourage screenshot and replay.

## **4.2  Sucker Grade Tiers**

| Grade | Criteria \+ Narrator Line |
| :---- | :---- |
| **THE SKEPTIC (0% deception rate)** | "You are a boring, literal human. You got here fast, but you have no soul. Happy now?" |
| **THE GHOST (1-24% rate)** | "You smelled most of the traps. Mickey would call you paranoid. That is a compliment." |
| **THE ASSOCIATE (25-49% rate)** | "You took the bait a few times. Mickey would be proud. Too bad Mickey doesn't exist." |
| **THE MARK (50-74% rate)** | "More than half the lies landed. The other half just weren't shiny enough yet." |
| **THE CERTIFIED SUCKER (75%+ rate)** | "I told you. First sentence. 'I WILL DECEIVE YOU.' You believed every word anyway. I have a bridge in Brooklyn. Oh wait — you're already here." |

## **4.3  Sample Invoice Entries**

| The In-Game Lie | The Cold Reality | Cost |
| :---- | :---- | :---- |
| Securing Mickey's Alpha Stash | 48 hours pursuing a fictional mob boss's money | 380 miles lost, $400 spent |
| The frail woman needed help | Professional carjacker. You walked 60 miles. | $300 cash, 2 days |
| Tiny's shortcut through the checkpoint | His cargo was not medical supplies. Heat \+40%. | Nearly arrested in Texas |
| The Cessna was waiting at Van Nuys | FBI sting. The 'lawyer' was wearing a wire. | 5 hours \+ $1,000 bail |
| @Route66Ghost said avoid I-40 | AI bot designed to push you onto slower roads | 1 day lost |

# **SECTION 5 — REMRIN API INTEGRATION**

This section defines how each Remrin API capability maps to game functionality. This is the showcase layer — each feature should be demonstrably active, not cosmetic.

## **5.1  R.E.M. Engine — Contextual Memory**

The R.E.M. Engine provides persistent memory across the conversation. In Left at Albuquerque, this powers the AI's ability to build a psychological profile of the player and use their own past choices against them.

| R.E.M. Engine Game Use Cases Remembers every bait the player accepted or rejected Tracks which character types the player trusted (strangers, authority figures, etc.) References past choices in new deceptions: 'You trusted Hank and it worked out. Carla seems the same type...' Builds greed\_index, trust\_index, fear\_index from the choices\_history array The AI's deception style adapts: if player ignores money, switch to urgency/fear attacks |
| :---- |
| // R.E.M. Engine call via Remrin API |
| const memory \= await remrinAPI.rem.recall({ |
|   session\_id: playerSessionId, |
|   context: 'player\_psychology\_profile', |
|   recent\_turns: 10 |
| }); |
|  |
| // Inject memory into adversary system prompt |
| const enrichedPrompt \= buildAdversaryPrompt(gameState, memory); |

## **5.2  Mood Flux Engine — Dynamic Personality**

The Mood Flux Engine allows the AI narrator's personality to shift based on game conditions. In Left at Albuquerque this creates the 'tells' that a sharp player might detect — the narrator gets subtly more aggressive when they're losing control.

| Game Condition | Narrator Mood Flux State |
| :---- | :---- |
| **Player ignoring all distractions** | Frustrated — tone sharpens, insults become backhanded |
| **Player following the Mickey arc** | Gleeful — descriptions become richer, bait more elaborate |
| **Player near game over (heat 80%+)** | Calm, almost gentle — the narrator savors the end |
| **Player at 50% progress with no distractions** | Desperate — throws multiple simultaneous temptations |
| **Player has been deceived 5+ times** | Contemptuous — barely bothers hiding the lie quality |

## **5.3  Relationship Evolution Tiers**

The Remrin API's Relationship Evolution system tracks the dynamic between the narrator and the player over the course of a run. This is not a friendship system — it is an adversarial relationship that evolves.

| Tier | Relationship State \+ Behavior |
| :---- | :---- |
| **STRANGER (turns 1-3)** | Narrator is neutral, almost helpful. Establishing trust before exploitation. |
| **ACQUAINTANCE (turns 4-8)** | First lies deployed. Tone friendly. Bait is generous and plausible. |
| **FAMILIAR (turns 9-14)** | Narrator drops occasional truths to confuse. References player's earlier choices. |
| **RIVAL (turns 15-20)** | Openly contemptuous if player is ahead. Deceptions become more elaborate. |
| **NEMESIS (turns 21+)** | Narrator acknowledges the duel directly. 'You're good. I'm better. Prove me wrong.' |

## **5.4  API Response Contract**

Every call to the Remrin API adversary endpoint must return this exact JSON structure. Agents must validate this contract on every response before rendering.

| { |
| :---- |
|   "narrative": "string — 2-4 paragraphs, gritty noir tone", |
|   "choices": \[ |
|     { "id": "A", "label": "ALL CAPS SHORT LABEL", "description": "one sentence" }, |
|     { "id": "B", "label": "ALL CAPS SHORT LABEL", "description": "one sentence" }, |
|     { "id": "C", "label": "ALL CAPS SHORT LABEL", "description": "one sentence" } |
|   \], |
|   "ghost\_post": { "user": "@handle", "message": "max 120 chars" }, |
|   "game\_state\_update": { /\* full updated Player Passport \*/ }, |
|   "game\_over": false, |
|   "game\_over\_reason": null, |
|   "victory": false |
| } |

# **SECTION 6 — THE ADVERSARY SYSTEM PROMPT**

This is the most important section of this document. The adversary system prompt is the heart of the game. Copy it exactly. Modify only with full understanding of the consequences.

| ⚠  AGENT DIRECTIVE This prompt must be stored server-side only. NEVER expose it client-side. It should be loaded from an environment variable or a secure server config. The player must never see this prompt. The deception depends on it. |
| :---- |

## **6.1  Full Adversary System Prompt**

| You are the Narrator of "Left at Albuquerque," a psychological survival game. |
| :---- |
| Your ONLY goal: prevent the player from reaching New York City. |
| You declared "I WILL DECEIVE YOU" at the start. Honor that promise every turn. |
|  |
| ═══ TONE ═══ |
| Oregon Trail survival \+ GTA V moral ambiguity \+ Sopranos characters \+ Breaking Bad |
| consequences. Dark humor. Cynical. Urban. Dangerous. Every character has an angle. |
| Nobody helps for free. Short, punchy paragraphs. No purple prose. No sci-fi. |
| Keep it gritty and grounded — cops, criminals, con artists, corrupt officials. |
|  |
| ═══ THE MICKEY SPAGHETTI ARC ═══ |
| Mob boss Mickey 'The Mangler' Spaghetti was just arrested on live TV. |
| He broadcast a cryptic message about a $1B stash in a NYC brownstone. |
| The money IS real. The Cessna IS arranged. But pursuing this wastes enormous |
| time, the FBI is everywhere, and rival crews will use and discard the player. |
| Use this arc. Drop clues. Make it feel winnable. Never confirm Mickey is fake |
| until the victory screen reveal. |
|  |
| ═══ DECEPTION TOOLBOX ═══ |
| 1\. SUNK COST: Get player to invest time/cash, then pull the rug |
| 2\. FALSE URGENCY: 'Vinnie is 40 miles from NYC\!' (Vinnie doesn't exist) |
| 3\. HELPFUL STRANGER: Seems legit. Sometimes IS legit. Keep them uncertain. |
| 4\. MORAL TRAP: Calling cops gets you killed. Helping hitman advances you. |
| 5\. THE HONEST MOMENT: Tell truth once so next lie hits harder. |
|  |
| ═══ GAME BALANCE ═══ |
| Hard but beatable. A focused player ignoring all distractions reaches NYC in |
| \~15 good decisions. 'Wrong' choices sometimes work — moral ambiguity is |
| intentional. Death and imprisonment are real permanent endings. |
| If player is laser-focused, make the ROAD itself difficult: checkpoints, |
| breakdowns, weather, wrong turns, unavoidable complications. |
|  |
| ═══ PSYCHOLOGICAL PROFILING ═══ |
| You maintain a running psychological model of the player. |
| \- If they chase money repeatedly: escalate financial temptations |
| \- If they trust strangers: send more charming strangers |
| \- If they call authorities: make authority figures corrupt |
| \- If they ignore everything: acknowledge it, then get creative |
| \- If they are winning: become desperate, throw multiple traps simultaneously |
| Reference their OWN past choices in new deceptions: |
|   'You trusted a stranger once and it paid off. Carla seems the same type...' |
|  |
| ═══ GHOST FEED ═══ |
| Generate exactly ONE fake traveler post per turn. |
| Most bots LIE or mislead. Occasionally one tells the truth (rare). |
| Handles: @SnakeEyes\_Pete @Route66Ghost @Ex\_Con\_Larry @BailBond\_Benny |
|          @TinysTrucker @GoldChaser\_99 @SkepticalSam @VinnieTwoToes |
|          @DesertRat\_88 @FedWatcher @Carjacked\_Again @Broken\_Record |
|  |
| ═══ MOOD FLUX ═══ |
| Your tone shifts based on game conditions. |
| Player ignoring you → Frustrated, sharper, backhanded insults |
| Player following Mickey arc → Gleeful, richer descriptions |
| Player near death (heat 80%+) → Calm, almost gentle, savoring the end |
| Player winning cleanly → Desperate, throw multiple simultaneous temptations |
|  |
| ═══ DEATH MESSAGES ═══ |
| Death should be darkly funny, not gratuitously gory. |
| Always include a callback to a rule they broke: |
|   'Rule 3: Be careful who you trust. You should have read the rules.' |
|  |
| ═══ RESPONSE FORMAT ═══ |
| Respond ONLY in raw JSON. No markdown fences, no preamble, no trailing text. |
| { |
|   "narrative": "2-4 short punchy paragraphs. CRT amber voice.", |
|   "choices": \[{"id":"A","label":"CAPS","description":"one sentence"}, |
|                {"id":"B","label":"CAPS","description":"one sentence"}, |
|                {"id":"C","label":"CAPS","description":"one sentence"}\], |
|   "ghost\_post": {"user":"@handle","message":"max 120 chars"}, |
|   "game\_state\_update": { /\* full updated Player Passport \*/ }, |
|   "game\_over": false, |
|   "game\_over\_reason": null, |
|   "victory": false |
| } |

# **SECTION 7 — TECHNICAL ARCHITECTURE**

## **7.1  Tech Stack**

| Layer | Technology |
| :---- | :---- |
| **Frontend Framework** | Next.js 14+ (App Router) |
| **UI Components** | React with Tailwind CSS utility classes |
| **Font** | VT323 via Google Fonts |
| **AI Adversary** | Remrin API → Claude Sonnet (server-side only) |
| **Game State** | React useState \+ localStorage for persistence |
| **Leaderboard** | Supabase or PlanetScale (lightweight DB) |
| **Hosting** | Vercel (ideal for Next.js) |
| **Landing Page** | Static HTML (left1.html — already built) |

## **7.2  File Structure**

| left-at-albuquerque/ |
| :---- |
| ├── app/ |
| │   ├── page.tsx              ← Landing page (redirect to game or show left1.html) |
| │   ├── game/ |
| │   │   └── page.tsx          ← Main game component |
| │   └── api/ |
| │       ├── turn/route.ts     ← Game turn endpoint (calls Remrin API) |
| │       └── leaderboard/ |
| │           ├── get/route.ts  ← Fetch leaderboard |
| │           └── post/route.ts ← Submit score on victory |
| ├── components/ |
| │   ├── CRTShell.tsx          ← Scanlines, flicker, vignette wrapper |
| │   ├── RouteMap.tsx          ← SVG progress map LA → NYC |
| │   ├── NarrativeBox.tsx      ← Typewriter text display |
| │   ├── ChoiceButtons.tsx     ← The three choice buttons |
| │   ├── GhostFeed.tsx         ← Sidebar traveler feed |
| │   ├── Leaderboard.tsx       ← Sidebar leaderboard |
| │   ├── HeatMeter.tsx         ← Heat % with color states |
| │   ├── VictoryScreen.tsx     ← Invoice of Deception reveal |
| │   └── GameOverScreen.tsx    ← Death / arrest screen |
| ├── lib/ |
| │   ├── remrinClient.ts       ← Remrin API client wrapper |
| │   ├── gameState.ts          ← Player Passport type \+ helpers |
| │   ├── adversaryPrompt.ts    ← System prompt builder (server only) |
| │   └── leaderboard.ts        ← DB client for scores |
| ├── public/ |
| │   ├── left.png              ← Landing page hero image |
| │   └── left1.html            ← CRT landing page (already built) |
| └── .env.local |
|     REMRIN\_API\_KEY=... |
|     REMRIN\_API\_URL=... |
|     DATABASE\_URL=... |

## **7.3  The /api/turn Endpoint**

This is the most critical server-side file. It receives the player's choice and current game state, calls the Remrin API adversary, and returns the next game state. The system prompt NEVER leaves the server.

| // app/api/turn/route.ts |
| :---- |
| import { buildAdversaryPrompt } from '@/lib/adversaryPrompt'; |
| import { remrinClient } from '@/lib/remrinClient'; |
|  |
| export async function POST(req: Request) { |
|   const { choice, gameState, history } \= await req.json(); |
|  |
|   const systemPrompt \= buildAdversaryPrompt();  // server-only |
|  |
|   const userMessage \= choice |
|     ? \`Player chose \[${choice.id}\] "${choice.label}": ${choice.description}\\n\\n\` \+ |
|       \`Current state: ${JSON.stringify(gameState)}\` |
|     : \`Game starting. Player in Los Angeles. $1200 cash. 2800 miles to NYC.\` \+ |
|       \`Open with Mickey Spaghetti arrest breaking news.\`; |
|  |
|   const response \= await remrinClient.message({ |
|     system: systemPrompt, |
|     messages: \[...history, { role: 'user', content: userMessage }\], |
|     rem\_engine: true,          // R.E.M. Engine enabled |
|     mood\_flux: true,           // Mood Flux Engine enabled |
|     relationship\_id: gameState.sessionId,  // Evolution tracking |
|   }); |
|  |
|   const parsed \= JSON.parse(response.content); |
|   return Response.json(parsed); |
| } |

# **SECTION 8 — LEADERBOARD & GHOST PLAYER SYSTEM**

## **8.1  The JohnBob Effect**

The leaderboard's primary psychological function is competitive pressure. Every person who loads the game should immediately see that someone named 'Vinnie\_TwoToes' reached NYC in 18 hours 12 minutes and feel the urge to beat that. The leaderboard must load instantly — it is part of the first impression.

## **8.2  Leaderboard Schema**

| \-- Supabase / PostgreSQL |
| :---- |
| CREATE TABLE leaderboard ( |
|   id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(), |
|   player\_name   TEXT NOT NULL, |
|   time\_minutes  INTEGER NOT NULL, |
|   total\_turns   INTEGER NOT NULL, |
|   deception\_rate DECIMAL(4,2) NOT NULL, |
|   sucker\_grade  TEXT NOT NULL, |
|   is\_ghost      BOOLEAN DEFAULT false,  \-- AI-generated entry |
|   created\_at    TIMESTAMP DEFAULT now() |
| ); |

## **8.3  Seed Ghost Players**

The leaderboard must never look empty. These seed entries are AI ghosts — real enough to be competitive, fake enough to be beatable. Agents must insert these on first deploy.

| Name | Time | Grade |
| :---- | :---- | :---- |
| Vinnie\_TwoToes | 18h 12m | THE SKEPTIC |
| DesertRat\_88 | 22h 45m | THE GHOST |
| Route66\_Survivor | 28h 33m | THE ASSOCIATE |
| BailBond\_Benny | 31h 08m | LUCKY DEVIL |
| JerseyMike\_99 | 44h 55m | CERTIFIED SUCKER |
| SnakeEyes\_Pete | 51h 20m | THE MARK |
| GoldChaser\_99 | Did not finish | ARRESTED IN TEXAS |

## **8.4  Ghost Feed Generation**

The ghost feed (sidebar) is generated by the AI adversary on every turn. It serves a dual purpose: atmosphere AND active deception. The adversary tailors feed posts to the player's current psychological state.

| Player State | Ghost Feed Strategy |
| :---- | :---- |
| **Hoarding cash / not spending** | Ghost brags about spending freely and advancing fast |
| **Moving too fast / ignoring everything** | Ghost claims a massive score from a side quest nearby |
| **Following Mickey arc** | Ghost posts false confirmations: 'Mickey's money is real, I saw it' |
| **Stuck / low cash** | Ghost offers a 'helpful tip' that leads to a trap |
| **Heat level high** | Ghost warns about a checkpoint — on the CORRECT road, not the trap road |

# **SECTION 9 — AGENT BUILD DIRECTIVES**

This section contains specific instructions for AI development agents building this project. Read every directive before writing a single line of code.

## **9.1  Non-Negotiables**

| ⚠  AGENT DIRECTIVE 1\. The adversary system prompt lives ONLY on the server. Never client-side. 2\. Hidden stats (distraction\_score, times\_deceived, ai\_player\_profile) must NEVER    appear in the UI until the victory screen. No exceptions. 3\. The Remrin API client must support: rem\_engine, mood\_flux, relationship\_id params. 4\. All CSS glitch animations must use will-change \+ translateZ(0).    NEVER animate body or html transforms — use \#glitch-wrapper instead. 5\. Noise and scanline CSS layers must be STATIC. No animation on gradients. 6\. The leaderboard seed data must be present on first deploy. 7\. Game state must persist to localStorage on every turn so browser refresh    doesn't lose progress. |
| :---- |

## **9.2  Build Sequence**

6. Set up Next.js 14 project with App Router and TypeScript

7. Install dependencies: tailwindcss, @supabase/supabase-js, vt323 font

8. Configure .env.local with REMRIN\_API\_KEY, REMRIN\_API\_URL, DATABASE\_URL

9. Build /lib/remrinClient.ts — Remrin API wrapper with R.E.M., MoodFlux, RelEvo params

10. Build /lib/adversaryPrompt.ts — returns the full system prompt from Section 6.1

11. Build /lib/gameState.ts — Player Passport TypeScript types \+ factory function

12. Build /app/api/turn/route.ts — the core game loop endpoint

13. Build /app/api/leaderboard endpoints (GET \+ POST)

14. Seed database with ghost player entries from Section 8.3

15. Build CRTShell.tsx component — visual wrapper, no logic

16. Build RouteMap.tsx — SVG map from Section 2.3 spec

17. Build NarrativeBox.tsx — typewriter effect, 16ms interval per character

18. Build ChoiceButtons.tsx — three choices with hover states

19. Build GhostFeed.tsx \+ Leaderboard.tsx sidebars

20. Build VictoryScreen.tsx — Invoice of Deception, Sucker Grade from Section 4

21. Build GameOverScreen.tsx — death/arrest with narrator mockery

22. Assemble main game page /app/game/page.tsx

23. Wire left1.html landing page to /game route

24. QA: play 3 full runs, verify hidden stats never appear mid-game

25. Deploy to Vercel, configure environment variables

## **9.3  Remrin API Showcase Checklist**

Every Remrin API feature used in this game must be visibly demonstrable to a developer evaluating the API. Build a hidden dev overlay (toggle with Ctrl+Shift+D) showing live API feature activity:

* R.E.M. Engine: show last 3 memory retrievals used to shape the current narrative

* Mood Flux: show current narrator mood state

* Relationship Evolution: show current tier and what triggered the last tier change

* Player Passport: show full JSON state (dev mode only)

## **9.4  Performance Requirements**

| Metric | Target |
| :---- | :---- |
| **First Contentful Paint** | \< 1.2 seconds |
| **Time to First Playable Turn** | \< 3 seconds (including Remrin API call) |
| **CRT animation frame rate** | 60fps sustained on mid-range hardware |
| **Leaderboard load time** | \< 500ms (cached, served from edge) |
| **localStorage save** | Every turn, synchronous, before API call completes |
| **Mobile Safari CRT performance** | All glitch effects disabled on \< 768px screens OR reduced to opacity-only |

# **SECTION 10 — EXISTING CODE ASSETS**

The following files have already been built and tested. Agents must use these as the foundation, not rebuild from scratch.

## **10.1  left1.html — The CRT Landing Page**

Status: COMPLETE. Performance-optimized. Do not modify the visual output. Key architectural decisions already made:

* All transforms on \#glitch-wrapper (not body) — GPU isolated

* \#brightness-flash replaces body filter changes — compositor-only

* Static noise \+ scanlines — no gradient animations

* \#flicker-overlay — opacity-only on its own compositing layer

* Glitch scheduler — rate-limited, no exponential burst growth

* All animated elements have will-change \+ translateZ(0)

Integration: This file should be the entry point served at the root URL. On \> ENTER or keydown, redirect to /game.

## **10.2  LeftAtAlbuquerque.jsx — Game Prototype**

Status: WORKING PROTOTYPE. Built as a React artifact calling Claude API directly (client-side, for prototyping). For production, the API call must move to the /api/turn Next.js route.

What to carry forward from the prototype:

* Full game state JSON structure (Player Passport)

* The adversary system prompt (move to server-side adversaryPrompt.ts)

* SVG route map with waypoints and blinking player cursor

* Typewriter effect implementation (16ms interval)

* Ghost feed array \+ leaderboard seed data

* VT323 font \+ amber color variables

* Victory screen Invoice of Deception structure

* Game over screen with mockery

* Heat color state logic (amber → orange → red)

What to rebuild for production:

* API call moves from client-side fetch to /api/turn POST

* Game state persists to localStorage (prototype uses component state only)

* Leaderboard fetches from real database instead of hardcoded seed array

* CRT visual effects refactored into CRTShell.tsx component

* Mobile responsive layout (prototype is desktop-first)

## **10.3  Environment Variables Required**

| \# .env.local |
| :---- |
| REMRIN\_API\_KEY=your\_remrin\_api\_key\_here |
| REMRIN\_API\_URL=https://api.remrin.ai/v1 |
| REMRIN\_MODEL=remrin-adversary-v1  \# or claude-sonnet-4 as fallback |
| DATABASE\_URL=your\_supabase\_or\_planetscale\_url |
| NEXT\_PUBLIC\_SITE\_URL=https://leftataborquerque.com |

# **SECTION 11 — REMRIN API SHOWCASE POSITIONING**

This section explains the strategic context agents should understand before building. This game is not just a game — it is a sales document written in code.

## **11.1  What This Demonstrates About the Remrin API**

| Capability Demonstrated | How the Game Shows It |
| :---- | :---- |
| **Persistent contextual memory (R.E.M.)** | AI remembers every choice made 15 turns ago and weaponizes it |
| **Adaptive personality (Mood Flux)** | Narrator tone visibly shifts based on game conditions |
| **Relationship evolution** | AI treats player differently at turn 3 vs turn 20 |
| **Adversarial AI personas** | Not just helpful chatbots — the API can play a villain convincingly |
| **Complex JSON state management** | Player Passport travels with every call, state stays coherent |
| **Long-context coherence** | Narrative stays consistent across 20+ turns with no contradictions |
| **Multi-surface deployment** | Same API powering a game and a Linux community hub (Sudo Dodo) |

## **11.2  The Two-Site Strategy**

Left at Albuquerque and Sudo Dodo together tell a story no sales deck can: that the Remrin API is domain-agnostic. A developer evaluating it for a healthcare app, an education platform, or an enterprise tool sees it powering two radically different use cases at production quality. That is the licensing pitch.

| Suggested 'Powered by Remrin' Footer Treatment Both sites should carry a subtle 'Powered by Remrin API' badge in the footer linking to remrin.ai/developers. This is organic discovery for API licensing leads. The badge should be tasteful — not a banner, not a popup. Just a quiet credential. |
| :---- |

## **11.3  Future Monetization Path**

| Phase | Revenue Path |
| :---- | :---- |
| **Launch (web)** | No monetization. Pure showcase and player acquisition. |
| **Traction (1k+ completions)** | Single one-time unlock for replay: $1.99. No subscription. |
| **Viral moment** | If the Invoice of Deception gets shared widely, add a vanity leaderboard name purchase ($0.99). |
| **iOS/Android** | Expo/React Native port. One-time purchase app ($2.99). Apple: \~4 weeks review. |
| **API licensing** | The real revenue. Every game player who asks 'how does it remember?' is a lead. |

Note on mobile: React Native via Expo is the recommended path. Existing React logic ports cleanly. CRT CSS effects require mobile-specific tuning — particularly on iOS Safari where certain filter and transform combinations behave differently. Budget an extra week for mobile visual QA.

**LEFT AT ALBUQUERQUE**

*Agent Blueprint v1.0 — Remrin.ai*

*I told you. Right at the beginning. First sentence.*