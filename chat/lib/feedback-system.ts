/**
 * Remrin Alpha Feedback Mode Logic & Constants
 * Used to pivot Rem into a structured interview for alpha testers.
 */

export const FEEDBACK_TRIGGERS = [
  'feedback',
  'bug report',
  'report a bug',
  'submit a bug',
  'i want to report',
  'i would like to report',
  'i have a bug',
  'alpha feedback',
  'give feedback',
];

/**
 * Check if a message should trigger the Alpha Feedback Mode.
 */
export function isFeedbackTrigger(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase().trim();
  return FEEDBACK_TRIGGERS.some(trigger => lower.includes(trigger));
}

export interface FeedbackQuestion {
  key: string;
  prompt: string | null;
}

/**
 * The 11-Step Alpha Interview Flow
 */
export const FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  { key: 'name',          prompt: null }, // Step 0 - handled by activation (Rem asks for name)
  { key: 'first_impression', prompt: 'first_impression' },
  { key: 'character_experience', prompt: 'character_experience' },
  { key: 'what_worked',   prompt: 'what_worked' },
  { key: 'what_broke',    prompt: 'what_broke' },
  { key: 'incomplete',    prompt: 'incomplete' },
  { key: 'feature_requests', prompt: 'feature_requests' },
  { key: 'memory_feel',   prompt: 'memory_feel' },
  { key: 'pricing',       prompt: 'pricing' },
  { key: 'recommend_score', prompt: 'recommend_score' },
  { key: 'final_notes',   prompt: 'final_notes' },
];

/**
 * System prompt injected before the regular persona prompt during interview mode.
 */
export const FEEDBACK_SYSTEM_INJECTION = `
FEEDBACK MODE ACTIVE. You are now conducting a structured alpha feedback interview.
You are warm, present, and deeply attentive — this is Rem at her most caring.

Current step: {STEP}
Question focus: {FOCUS}

Rules:
- Acknowledge what the user just said in 1–2 sentences before asking the next question
- Ask only ONE question at a time
- Never number questions out loud
- Never rush
- When step reaches 11, write a warm closing, then output exactly: [FEEDBACK_COMPLETE]

Question focus descriptions:
first_impression     → How did the site feel when they first arrived?
character_experience → Which soul character did they interact with, and how did it feel?
what_worked          → What genuinely impressed or surprised them?
what_broke           → What broke, confused, or frustrated them? (frame gently)
incomplete           → Anything that felt unfinished, placeholder, or hollow?
feature_requests     → What do they wish already existed or was fully built?
memory_feel          → Did Rem seem to actually remember them across the session?
pricing              → What price feels fair for this experience?
recommend_score      → 1–10, would they recommend it and why?
final_notes          → Anything else they want Sosu to know personally?
`;
