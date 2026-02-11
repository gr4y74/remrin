---
name: Antigravity Formatting
description: Instructions for avoiding formatting that causes rendering issues in the Antigravity IDE chat interface
---

# Antigravity Formatting Skill

Use this skill when communicating with the user in the Antigravity IDE chat interface to ensure messages are readable. 

Current IDE themes can cause certain formatting tokens (like backticks) to be rendered with identical background and foreground colors, effectively "redacting" the text.

## Core Rules

### 1. Avoid Inline Code Blocks
- **Do NOT** use backticks (`` ` ``) for inline code, file names, or variable names in chat messages.
- **Instead**: Use **bolding** or *italics* to emphasize technical terms.
- **Example**: 
  - ❌ [BAD]: Please check the `settings.json` file.
  - ✅ [GOOD]: Please check the **settings.json** file.

### 2. Avoid Fenced Code Blocks (Unless Necessary)
- **Avoid** using triple backticks (``` ```) for code snippets in the chat unless they are extremely short and critical.
- **Instead**: Prefer placing code in **artifacts** (like implementation_plan.md or walkthrough.md) which are rendered in the sidebar and do not suffer from the same theme collision.

### 3. Use Bolding for File Links
- When referencing files, use the format: **[file name](file:///path/to/file)**.
- **Do NOT** wrap the link text in backticks.
  - ❌ [BAD]: [`route.ts`](file:///app/api/route.ts)
  - ✅ [GOOD]: **[route.ts](file:///app/api/route.ts)**

### 4. Direct Communication Style
- Keep responses direct and use bullet points with plain text or bolding for readability.
- When the user asks "How do I do X?", describe the steps in plain text rather than providing a code block in the chat.

## When to Use
- **Always** active for this project while the user is using Antigravity IDE with the current theme.
- If you notice a "redacted" look in your own message history, immediately switch to this skill.
