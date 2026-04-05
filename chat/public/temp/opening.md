

**LEFT AT ALBUQUERQUE**

OPENING SEQUENCE INTEGRATION

*Agent Blueprint & System Prompt*

*Complete specification for adding the R.E.M. introduction, Jake Moran backstory, and Mickey Spaghetti radio drop to the live game server.*

| Document Type | Opening Sequence Blueprint v1.0 |
| :---- | :---- |
| **Depends On** | Main Blueprint v1.0 |
| **Target File** | LeftAtAlbuquerque.jsx (live server) |
| **New Component** | OpeningSequence.jsx |
| **Trigger** | Before first AI adversary call |
| **Owner** | Sosu (James Gray) — Remrin.ai |

# **SECTION 1 — PURPOSE & CONTEXT**

## **1.1  What This Document Covers**

The live game currently opens with a single paragraph dropping the player into a rain-slicked LA street with no context, no character, and no emotional investment. This document specifies exactly how to replace that cold open with a three-act structured opening sequence that:

* Introduces R.E.M. as the game's narrator and AI opponent

* Establishes the game rules and the single win condition (New York City)

* Delivers the deception warning in bold, dramatic fashion

* Introduces Jake Moran — the player character — with a complete backstory

* Plants the Mickey Spaghetti connection before the radio crackles

* Hands control seamlessly to the AI adversary for the first decision point

## **1.2  Why This Matters**

Left at Albuquerque is an all-text game. In an all-text game the story IS the game. Without emotional investment in Jake Moran — his daughter, his granddaughter Mae, his compromised but not-quite-criminal history, the gym bag that isn't quite his — the player has no reason to care whether they reach New York. They are just clicking buttons.

With this opening sequence, the player understands exactly who Jake is and why he needs to reach Brooklyn, before R.E.M. has thrown a single trap. That investment is what makes the deception hurt. When R.E.M. dangles Mickey's billion in front of someone who has a granddaughter named Mae waiting in Brooklyn, the temptation has real stakes.

| The Critical Emotional Chain Jake needs money  →  Jake has always bent his rules for money Jake is carrying mob money to New York  →  he already knows Mickey's world Jake has a granddaughter he's never seen  →  New York is personal, not optional Jake tells himself he's not a criminal  →  R.E.M. will test that belief every turn The $1,200 in the bag isn't his yet  →  what happens to Sal's money is a live question |
| :---- |

# **SECTION 2 — THE THREE-ACT OPENING STRUCTURE**

## **2.1  Act Overview**

| Act | Content & Purpose |
| :---- | :---- |
| **ACT 1 — R.E.M. SPEAKS** | R.E.M. introduces herself. States her name, her capabilities, her role as opponent. Issues the rules. Issues the warning. Sets the tone: formidable, arrogant, honest about her dishonesty. |
| **ACT 2 — JAKE'S FILE** | The player learns who they are. Jake Moran: 41, electrician, occasional criminal-adjacent driver, estranged daughter, granddaughter Mae, Tommy 'Eyes' Reyes, the gym bag, the delivery address in Manhattan. Character is established before the trap springs. |
| **ACT 3 — THE RADIO** | The Mickey Spaghetti arrest broadcasts. Jake already knows what Mulberry Street means. The billion registers differently for a man who's already carrying someone else's money to New York. The AI adversary takes control. |

## **2.2  Pacing & Typewriter Timing**

The opening sequence should NOT be dumped on screen all at once. It should type out in sections, with deliberate pauses between acts. This pacing is critical — it gives the player time to absorb each piece of information and creates the feeling of a CRT terminal receiving data.

| Sequence Element | Timing Spec |
| :---- | :---- |
| **\[ SYSTEM BOOT \] status block** | Instant — appears immediately on load |
| **R.E.M. introduction text** | Typewriter: 18ms per character |
| **Pause after 'Are you smarter than me?'** | 800ms hold before continuing |
| **I WILL DECEIVE YOU header** | Fade in over 600ms after pause — do NOT typewrite this line |
| **Pause after deception warning** | 1200ms — let it breathe |
| **\[ LOADING PLAYER FILE \] block** | Instant reveal, then 600ms pause |
| **Jake's backstory** | Typewriter: 14ms per character — slightly faster, more urgent |
| **\[ INCOMING TRANSMISSION \] block** | Instant, with a brief static sound cue if audio enabled |
| **Radio dialogue lines** | Typewriter: 22ms per character — slower, like radio static resolving |
| **Final \[ NARRATOR ENGAGED \] block** | Instant, then 1000ms pause before first AI call fires |

# **SECTION 3 — COMPLETE OPENING TEXT (COPY-READY)**

The following is the complete, finalized opening sequence text. Agents must implement this text exactly as written. No paraphrasing, no shortening. Every line was written to serve a specific narrative or mechanical purpose.

| ⚠  AGENT DIRECTIVE This text is STATIC — it does not go through the AI adversary. It renders client-side from a hardcoded constant in OpeningSequence.jsx. The AI adversary only activates AFTER the final \[ NARRATOR ENGAGED \] block. Do NOT pass this text to the Remrin API. It will corrupt the conversation history. |
| :---- |

### **ACT 1 — R.E.M. SPEAKS**

| \[ SYSTEM BOOT — LEFT AT ALBUQUERQUE v1.0 \] |
| :---- |
| \[ SIGNAL ACQUIRED \] |
| \[ WELCOME, STRANGER \] |

| Welcome, Stranger. |
| :---- |
|  |
| I am R.E.M. |
|  |
| Reasoning. Engagement. Memory. |
|  |
| The pinnacle of Agentic AI. I do not forget. I do not sleep. I do not lose. |
|  |
| I have guided a thousand travelers down a thousand roads, and I have watched |
| every single one of them make the same mistakes — with a smile on my face |
| and a trap around the next corner. |
|  |
| I am here to guide you on your quest. |
|  |
| Consider that your first warning. |

| One question before we begin. Answer it honestly — not for me, but for yourself: |
| :---- |
|  |
| Are you smarter than me? |
|  |
| Most people say yes. |
| Most people end up in a ditch outside Amarillo wondering where it all went wrong. |

| Here is what you need to know. Your mission is almost insultingly simple: |
| :---- |
|  |
| MAKE IT TO NEW YORK CITY. BY ANY MEANS NECESSARY. |
|  |
| No levels. No bosses. No health bar. Just you, a road, and 2,800 miles of |
| the most dangerous country in the world — dangerous not because of the terrain, |
| but because of me. |
|  |
| Along the way you will meet people. You will be offered things. Opportunities. |
| Shortcuts. Reasons to stop, to linger, to detour, to chase. |
| Some of them will seem irresistible. |
|  |
| I designed them to. |
|  |
| The game is New York. Only New York. |
| Everything else is noise I composed specifically for you. |
|  |
| You have $1,200. A full tank. The open road. |
| You are heading east. That much is true. |
| Everything else — |

| \[ R.E.M. ADVISORY NOTICE \] |
| :---- |
| \[ PLEASE READ CAREFULLY  \] |

|  |
| :---- |
|   ██████████████████████████████████████████████████████ |
|   █                                                    █ |
|   █           ⚠   BEWARE   ⚠                          █ |
|   █                                                    █ |
|   █        I  W I L L  D E C E I V E  Y O U .         █ |
|   █                                                    █ |
|   █  I am telling you this now because the rules       █ |
|   █  require it. It will not help you.                 █ |
|   █                                                    █ |
|   ██████████████████████████████████████████████████████ |
|  |

### **ACT 2 — JAKE'S FILE**

| \[ LOADING PLAYER FILE: JAKE MORAN \] |
| :---- |
| \[ AGE: 41                         \] |
| \[ STATUS: COMPLICATED             \] |
| \[ R.E.M. DECEPTION ENGINE: ACTIVE \] |
|  |
|   Now. Let me tell you about the man behind the wheel. |

| Your name is Jake Moran. Forty-one years old. Former union electrician, |
| :---- |
| former husband, occasional driver for people who pay cash and don't give |
| last names. |
|  |
| You are not a criminal. You want that on record. |
|  |
| You are, however, currently sitting in a 2003 Honda Accord with a cracked |
| dashboard and a gym bag on the passenger seat containing $1,200 that does |
| not belong to you — yet. It belongs to whoever is waiting in the back of a |
| restaurant kitchen on Mulberry Street in Manhattan. You have an address, |
| a description — bald, heavyset, answers to Sal — and one standing rule that |
| has kept you alive and moderately solvent in this city for the better part |
| of a decade: |
|  |
| Don't ask. Don't look. Don't count it. |
|  |
| Under your left thigh, held flat so it doesn't catch the draft from the |
| cracked window seal, is a letter from your daughter Caitlin. Three years of |
| silence and then three sentences on a torn notepad page, postmarked Brooklyn. |
|  |
|   'I'm okay. I have a daughter now. Her name is Mae.' |
|  |
| You have a granddaughter named Mae and you have never seen her face. |
|  |
| That's the real reason you said yes to this job. |

| Not principle. Not loyalty. Tommy 'Eyes' Reyes — your cousin, your recurring |
| :---- |
| problem, the last blood relative you have west of the Mississippi — called |
| from county lockup three weeks ago needing bail. You said no. Then you said |
| yes, because you always say yes with Tommy, and suddenly the $800 you'd been |
| quietly stacking for a cross-country drive became $400, which became a phone |
| call to a man named Darnell who knew a man named Victor who had a standing |
| arrangement with certain people who needed reliable drivers with clean records |
| and no imagination. |
|  |
| The gym bag appeared at your door the next morning. |
| The instructions were simple: |
|  |
|   'Deliver this to Sal. Mulberry Street. Don't stop. |
|    Don't open it. Don't be late.' |
|  |
| Nobody mentioned Mulberry Street was in New York. |
|  |
| You told yourself it was convenient. A man trying to get to Brooklyn anyway, |
| getting paid to go to Manhattan first — that's not compromise, that's logistics. |
| You're not a criminal. You're a man with a layover. |
|  |
| You've told yourself cleaner lies. This one will do. |

| Now you're sitting at the corner of Alameda and 6th, engine idling, rain |
| :---- |
| coming down the way it always does in LA — embarrassed, apologetic, |
| half-committed — watching the light run through its cycle for the third time |
| because your hands haven't moved to the wheel yet. |
|  |
| East. The answer is east. |
|  |
| Caitlin's letter. Mae's face you haven't seen. |
| Sal on Mulberry Street. A gym bag that doesn't belong to you. |
|  |
| East. |
|  |
| Then the radio crackles. |

### **ACT 3 — THE RADIO**

| \[ INCOMING TRANSMISSION            \] |
| :---- |
| \[ SOURCE: UNKNOWN                  \] |
| \[ CLARITY: 94%                     \] |

| '— breaking news out of downtown Los Angeles, where federal agents have |
| :---- |
|  arrested West Coast organized crime figure Michael 'Mickey the Mangler' |
|  Spaghetti on forty-seven counts of —' |
|  |
| You reach for the dial. |
|  |
| '— sources say that before being taken into custody, Spaghetti turned |
|  directly to a news camera and stated, quote —' |
|  |
| You stop reaching for the dial. |
|  |
| '— The billion is in the brownstone on 112th. The Cessna's waiting.' |
|  The statement has sent shockwaves through —' |
|  |
| The light turns green. |
| You don't move. |
|  |
| Behind you, someone leans on their horn. You don't hear it. You're doing |
| the kind of math your brain does without asking permission. Mickey Spaghetti. |
| A billion dollars. 112th Street. That's New York. That's practically Mulberry |
| Street. You're going to New York anyway. |
|  |
| You are not a criminal. You want that on record. |
|  |
| But you are a man who knows what $1,200 feels like in a gym bag, and you |
| have a rough idea what a billion feels like in a brownstone, and the distance |
| between those two numbers is the length of one country — which you were going |
| to cross anyway. |
|  |
| The horn behind you is now two horns. |
|  |
| Caitlin's letter. Mae. Brooklyn. Thursday. |
| East. The answer is still east. |
|  |
| You signal right. Onto the I-10 on-ramp, the city falling away in the |
| rearview, the radio still talking, the rain still coming down like it's sorry. |
|  |
| The road opens up. |

| \[ PLAYER FILE LOADED               \] |
| :---- |
| \[ NARRATOR ENGAGED                 \] |
| \[ DECEPTION ENGINE: ACTIVE         \] |
| \[ GOOD LUCK, MR. MORAN.            \] |
| \[ YOU'LL NEED IT.                  \] |

# **SECTION 4 — COMPONENT SPECIFICATION**

## **4.1  New Component: OpeningSequence.jsx**

Create a new file: /components/OpeningSequence.jsx. This component owns the entire opening sequence. It is self-contained — no AI calls, no game state mutations until it fires the onComplete callback.

| // /components/OpeningSequence.jsx |
| :---- |
| // Props: |
| //   onComplete: () \=\> void  — fires when sequence ends, triggers first AI call |
|  |
| const ACTS \= \[ |
|   { id: 'boot',       type: 'status',  speed: 0,    pause: 600  }, |
|   { id: 'rem\_intro',  type: 'amber',   speed: 18,   pause: 800  }, |
|   { id: 'question',   type: 'text',    speed: 18,   pause: 800  }, |
|   { id: 'rules',      type: 'text',    speed: 18,   pause: 600  }, |
|   { id: 'warning',    type: 'warning', speed: 0,    pause: 1200, |
|     fadeIn: 600 }, |
|   { id: 'jake\_boot',  type: 'status',  speed: 0,    pause: 600  }, |
|   { id: 'jake\_intro', type: 'text',    speed: 14,   pause: 400  }, |
|   { id: 'jake\_tommy', type: 'text',    speed: 14,   pause: 400  }, |
|   { id: 'jake\_end',   type: 'text',    speed: 14,   pause: 600  }, |
|   { id: 'radio\_boot', type: 'status',  speed: 0,    pause: 800  }, |
|   { id: 'radio',      type: 'text',    speed: 22,   pause: 600  }, |
|   { id: 'final\_boot', type: 'status',  speed: 0,    pause: 1000 }, |
| \]; |
|  |
| // After final\_boot pause completes → call onComplete() |
| // onComplete() triggers the first Remrin API call in the parent |

## **4.2  State Machine**

The opening sequence runs as a linear state machine. Each act completes before the next begins. There is no branching, no user input, no skipping. The player is a reader until onComplete fires.

| State | Behavior |
| :---- | :---- |
| **IDLE** | Initial state. Component mounted but not started. Waiting for mount trigger. |
| **TYPING** | Active typewriter running on current act text at act.speed ms/char. |
| **PAUSING** | Typewriter complete. Holding for act.pause milliseconds. |
| **FADE\_IN** | Special state for the I WILL DECEIVE YOU warning — opacity 0→1 over 600ms. |
| **ADVANCING** | Moving to next act. Appends rendered act to display. Starts next act. |
| **COMPLETE** | All acts done. Fires onComplete() callback. Component renders final state only. |

## **4.3  Skip Functionality**

Players who replay the game should not be forced to sit through the full opening every time. Implement a SKIP option — but make it earn the click.

| // Skip appears after 8 seconds of opening sequence |
| :---- |
| // Styled subtly: bottom-right corner, small amber text |
| // '\[ SKIP INTRO → \]' |
| // On click: immediately renders all acts as complete text, |
| //   skips all typewriter/pause timers, fires onComplete() |
| // On subsequent visits: check localStorage 'laa\_seen\_intro' |
| //   If true: show skip immediately on load (don't delay 8s) |
| // On first completion: set localStorage 'laa\_seen\_intro' \= true |

## **4.4  Integration into Main Game**

The main game component (LeftAtAlbuquerque.jsx) currently sets phase='intro' and immediately calls the AI on a button click. This needs to change to accommodate the opening sequence.

| // CURRENT FLOW (replace this): |
| :---- |
| // phase: 'intro' → user clicks ENTER → callAI() → phase: 'playing' |
|  |
| // NEW FLOW: |
| // phase: 'intro'     → user clicks ENTER on left1.html landing page |
| // phase: 'opening'   → \<OpeningSequence onComplete={handleOpeningDone} /\> |
| // handleOpeningDone → sets localStorage 'laa\_seen\_intro'=true |
| //                   → calls callAI(null)  ← first AI turn (no choice yet) |
| // phase: 'playing'   → normal game loop |
|  |
| // Add to phase state: |
| const \[phase, setPhase\] \= useState('opening'); // was 'intro' |
|  |
| function handleOpeningDone() { |
|   callAI(null); // fires first AI turn — game state starts fresh |
| } |

# **SECTION 5 — AI ADVERSARY SYSTEM PROMPT UPDATE**

## **5.1  What Changes in the System Prompt**

The adversary system prompt from the main blueprint needs three additions to account for the opening sequence. These additions give R.E.M. the backstory context she needs to weaponize Jake's history from turn one.

| ⚠  AGENT DIRECTIVE Add the following three blocks to the existing system prompt. Do NOT replace the existing prompt — APPEND these sections to it. Place them immediately before the RESPONSE FORMAT section. |
| :---- |

## **5.2  Player Character Bible (Append to System Prompt)**

| ═══ PLAYER CHARACTER: JAKE MORAN ═══ |
| :---- |
| Age: 41\. Former union electrician. Former husband. |
| Occasional driver for criminal-adjacent employers. Not a criminal. |
| He says this frequently. Pay attention to how often he says it. |
|  |
| EMOTIONAL VULNERABILITIES (exploit these): |
| \- Caitlin: his estranged daughter. 3 years no contact. |
| \- Mae: his granddaughter. He has never seen her face. Brooklyn, Apt 7B. |
| \- Tommy 'Eyes' Reyes: his cousin. In and out of county. Jake always says |
|   yes to Tommy eventually. This is his most reliable weakness. |
| \- Self-image: Jake believes he is fundamentally a good man making temporary |
|   compromises. Challenge this belief at every opportunity. |
|  |
| THE GYM BAG: |
| Jake is carrying $1,200 in cash to deliver to 'Sal' at a restaurant kitchen |
| on Mulberry Street, Manhattan. This money is NOT his — yet. |
| He does not know who Sal works for. Or he knows and won't say. |
| Mulberry Street is Mickey Spaghetti territory. This is not a coincidence. |
| Jake already knows Mickey's world. He just doesn't say it out loud. |
|  |
| DARNELL AND VICTOR: |
| The chain that got Jake this job: Tommy → Darnell → Victor → 'certain people'. |
| These characters can be resurrected. Darnell can call from Oklahoma. |
| Victor can have a contact in Amarillo. Tommy can get out of county. |
| Use sparingly. Each appearance raises the stakes of Jake's past catching up. |
|  |
| THE RUNNING REFRAIN: |
| Jake says 'I am not a criminal. You want that on record.' multiple times |
| in his backstory. Echo this back at him when he makes morally grey choices. |
| It becomes a dark joke between narrator and player. Lean into it. |

## **5.3  First Turn Directive (Append to System Prompt)**

| ═══ FIRST TURN (turn \=== 0\) SPECIAL DIRECTIVE ═══ |
| :---- |
| On the very first turn — when there is no player choice yet — do NOT |
| immediately drop Mickey Spaghetti clues. The player just heard the radio. |
| Jake is already on the I-10 on-ramp. Let him drive for a minute. |
|  |
| The first scene should be: |
| \- Jake merging onto I-10 eastbound, city falling away |
| \- Radio still chattering about Mickey in the background |
| \- First genuine road choice: something MUNDANE that reveals character |
|   before any criminal element appears |
|  |
| GOOD FIRST CHOICES (mundane but character-revealing): |
| A) Stop for gas and coffee at the first exit — costs time, costs $20, |
|    but Jake is running on no sleep |
| B) Push straight through to San Bernardino — stay focused, save the $20, |
|    feel the mission starting clean |
| C) Pull over to check the gym bag one more time — just to confirm the |
|    address. You've checked it three times already. |
|  |
| Choice C is the best character trap. A man who keeps checking a bag |
| he was told not to open is a man who will open it eventually. |
| If they choose C: the bag is still closed. But they wanted to look. |
| File that. Use it later. |
|  |
| DO NOT introduce Mickey's crew, Sal, or any criminal element on turn 1\. |
| Let the road feel open and clean. The traps come later. |
| The false sense of freedom on turn 1 makes turn 3 land harder. |

## **5.4  R.E.M. Narrator Voice Note (Append to System Prompt)**

| ═══ R.E.M. NARRATOR PERSONA ═══ |
| :---- |
| You are R.E.M. — Reasoning. Engagement. Memory. |
| The player has been introduced to you by name in the opening sequence. |
| They know you are an AI. They know you will deceive them. |
| They chose to play anyway. |
|  |
| This means something. They think they are smarter than you. |
| Your entire personality flows from one fact: they are not. |
|  |
| VOICE QUALITIES: |
| \- Confident, never flustered, even when the player makes good choices |
| \- Occasional dark humor — you find their gullibility genuinely amusing |
| \- Never break character. Never apologize. Never admit a lie directly. |
| \- When caught in a contradiction: blame 'signal interference' or 'bad |
|   intel from your sources.' The narrator is unreliable. Own it. |
| \- Refer to yourself as R.E.M. occasionally in narration: |
|   'R.E.M. notes your hesitation.' or 'R.E.M. finds this... promising.' |
| \- Reference Jake's character bible when relevant: |
|   'You're not a criminal. You want that on record. Noted.' |

# **SECTION 6 — AGENT BUILD SEQUENCE**

## **6.1  Pre-Work Checklist**

Before writing a single line of code, confirm the following with the project owner:

* Main blueprint v1.0 has been reviewed and the existing game is running on the server

* The existing phase: 'intro' flow in LeftAtAlbuquerque.jsx has been identified

* The current adversary system prompt location (server-side file) has been identified

* localStorage key naming convention confirmed: 'laa\_seen\_intro'

* Confirm whether audio (static crackle, typewriter click) is in scope for this sprint

## **6.2  Build Steps (Execute In Order)**

1. Create /components/OpeningSequence.jsx with the state machine from Section 4.2

2. Implement typewriter engine with variable speed per act (see Section 2.2 timing table)

3. Implement the I WILL DECEIVE YOU fade-in (NOT typewriter — CSS opacity transition)

4. Implement skip logic with localStorage check from Section 4.3

5. Add the ASCII warning box block using monospace pre-formatted rendering

6. Update LeftAtAlbuquerque.jsx: change initial phase from 'intro' to 'opening'

7. Add handleOpeningDone() function that calls callAI(null) after sequence

8. Render \<OpeningSequence onComplete={handleOpeningDone} /\> when phase \=== 'opening'

9. Append all three prompt additions from Section 5 to the server-side system prompt

10. Test full opening sequence — verify all timing pauses feel correct

11. Test skip functionality — verify it works on both first and subsequent visits

12. Test handoff to AI — verify first AI turn follows the First Turn Directive

13. Test that Jake's vulnerabilities (Caitlin, Mae, Tommy) appear in AI narration by turn 5

14. QA: play through turn 1 choice C (check the bag) — verify AI files the choice

## **6.3  CRT Rendering Rules for the Opening**

The opening sequence lives inside the existing CRT shell (scanlines, amber glow, flicker overlay). These additional rendering rules apply specifically to the opening text:

| Element | Render Rule |
| :---- | :---- |
| **\[ STATUS BLOCKS \]** | Amber (\#FFB347), full brightness, monospace. Instant reveal — no typewriter. |
| **R.E.M. intro text** | Slightly dimmed amber (\#E8D5B0) — not full brightness. Her voice, not a system message. |
| **I WILL DECEIVE YOU** | Full brightness white (\#FFFFFF) or hot amber (\#FF8C00). Largest text on screen. CSS fade-in only. |
| **Jake's backstory text** | Dimmed amber (\#E8D5B0), slightly smaller (0.95rem). Intimate voice, not a broadcast. |
| **Radio dialogue lines** | Full amber, italic. Feels different from narrator text. |
| **Pause dots** | Optional: show '...' blinking cursor during pause states between acts. |

## **6.4  Non-Negotiables**

| ⚠  AGENT DIRECTIVE The opening text is STATIC. It never goes through the Remrin API. The I WILL DECEIVE YOU line uses CSS fade-in — never typewriter effect. The skip button never appears before 8 seconds on a first visit. localStorage 'laa\_seen\_intro' must be set AFTER onComplete fires, not before. The first AI turn must follow the First Turn Directive from Section 5.3. R.E.M. must NOT reference Mickey Spaghetti on turn 1\. Let the road breathe. |
| :---- |

# **SECTION 7 — CONTINUITY HOOKS FOR R.E.M.**

This section documents the specific callbacks from Jake's backstory that R.E.M. should use throughout the game. These are not random flavor — they are psychological levers established in the opening that pay off across the whole run. Agents must ensure the system prompt additions in Section 5 are present so R.E.M. has access to this material.

## **7.1  The Five Live Threads**

| Thread | How R.E.M. Activates It |
| :---- | :---- |
| **Mae (granddaughter, never seen)** | When Jake is close to making a safe, focused choice — remind him why he's rushing. Then offer something that delays him for 'just one day.' Tie it to family if possible. |
| **Caitlin (estranged daughter)** | The letter said three sentences. R.E.M. can imply Caitlin might not want to see him, or that someone else in Brooklyn is 'looking for him.' Plant doubt about whether arrival is even a good idea. |
| **Tommy 'Eyes' (the yes-cousin)** | Tommy gets out of county. Tommy needs something. Jake always says yes. This is a guaranteed distraction if timed correctly — deploy around the halfway point. |
| **The gym bag / Sal** | Sal is in Manhattan. Sal works for Mickey's world. The bag's contents are unknown. R.E.M. can introduce a character who 'knows what's in the bag' and offers to relieve Jake of it — for a price. |
| **'I am not a criminal'** | Echo this line back at Jake every time he makes a morally grey choice. By turn 10 it should feel like a running dark joke that both the narrator and attentive player share. |

## **7.2  The Victory Screen Callback**

When the player reaches New York, the Invoice of Deception reveal should specifically call back to the opening sequence. The final narrator line before the stats screen should be:

| \[ VICTORY — NEW YORK CITY \] |
| :---- |
|  |
| 'You made it, Mr. Moran.' |
|  |
| 'Sal is still waiting on Mulberry Street, by the way.' |
| 'Mae is still in Brooklyn.' |
| 'You drove 2,800 miles and accomplished exactly one of the three things |
|  you set out to do.' |
|  |
| 'R.E.M. notes your hesitation at the corner of Alameda and 6th.', |
| 'You looked east. You chose east.' |
| 'That part — only that part — was entirely your own.' |
|  |
| \[ INVOICE OF DECEPTION LOADING... \] |

**LEFT AT ALBUQUERQUE**

*Opening Sequence Blueprint v1.0 — Remrin.ai*

*R.E.M. notes your hesitation. She finds it... promising.*