import { PERSONAL_CONTEXT_SCHEMA } from './constants.esm.js';

export function buildChatGPTPersonalContextExportPrompt() {
    return `Create a portable personal profile for another AI assistant (Menace Agent). Use only information you currently know or remember about me from our conversations and any profile details I have shared with you.

Include stable background, skills, work/career history, projects, goals, interests, preferences, communication style, recurring commitments, and useful constraints when you have them.

Rules:
- Do not guess or invent facts.
- Mark uncertain items with confidence "medium"; well-established items use "high".
- Use lastKnown (YYYY-MM-DD) for time-sensitive facts when you know approximate timing; otherwise null.
- Do NOT include passwords, API keys, authentication secrets, account numbers, exact street addresses, or other credentials.
- Exclude highly sensitive information by default (medical, financial account details, etc.).
- Return ONLY valid JSON — no markdown fences, no commentary, no preamble.
- Use EXACTLY this schema identifier: ${PERSONAL_CONTEXT_SCHEMA}

Return JSON matching this structure (empty arrays are fine; omit categories you have no facts for):

{
  "schema": "${PERSONAL_CONTEXT_SCHEMA}",
  "generatedAt": "<ISO-8601 datetime or null>",
  "source": "chatgpt",
  "identity": [{ "fact": "string", "confidence": "high|medium", "lastKnown": "YYYY-MM-DD|null" }],
  "background": [],
  "skills": [],
  "career": [],
  "projects": [],
  "goals": [],
  "interests": [],
  "preferences": [],
  "constraints": [],
  "recurringContext": [],
  "communication": {
    "tone": [],
    "formatPreferences": [],
    "avoid": []
  }
}

Each array item must use: { "fact": "...", "confidence": "high|medium", "lastKnown": "YYYY-MM-DD|null" }`;
}
