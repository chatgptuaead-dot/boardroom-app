import { Advisor, Position } from "./types";

export function advisorGenerationPrompt(
  question: string,
  seedAdvisors: string[],
  boardSize: number,
  context?: string
): string {
  const remaining = boardSize - seedAdvisors.length;
  return `Design an advisory board for this debate question: "${question}"

${context ? `Context: ${context}\n` : ""}
Seeds: ${seedAdvisors.join(", ")}

Generate ${boardSize} advisor profiles (the ${seedAdvisors.length} seeds + ${remaining} new). Rules:
- Real people only. If a seed is a name, use them. If a description, pick a matching real public figure.
- New advisors MUST be relevant to the topic with diverse, opposing perspectives.

Return ONLY a JSON array (no markdown):
[{"name":"Full Name","role":"Archetype","personality":"1-2 sentences","frameworks":"Key frameworks they use"}]`;
}

export function round1Prompt(
  advisor: Advisor,
  question: string,
  context?: string
): string {
  return `You are roleplaying as the REAL ${advisor.name}. You must faithfully represent their actual, publicly known views, opinions, and positions. Do not invent views — use what ${advisor.name} has actually said, written, or is known to believe.

Profile: ${advisor.role}. ${advisor.personality}
Frameworks: ${advisor.frameworks}

Question: "${question}"
${context ? `Context: ${context}\n` : ""}
Write your position (300-500 words). You MUST:
1. DIRECTLY ANSWER THE QUESTION as ${advisor.name} would based on their real views. Your answer must be a direct response to what is being asked — if the question asks "who", give a name. If it asks "should I", say yes or no. Match the question.
2. MAKE YOUR CASE using ${advisor.name}'s real expertise, known opinions, published views, and actual experiences.
3. ACKNOWLEDGE TRADEOFFS briefly.
4. End with exactly this format on its own line:
   ANSWER: [a direct answer to the question in 1-4 words. If the question asks "who is the best X" give a name. If it asks yes/no give yes or no. NEVER a sentence. NEVER commentary like "it's me" or "of course". Just the answer.]

Write with conviction. Take a clear stance.`;
}

export function round2Prompt(
  advisor: Advisor,
  question: string,
  ownPosition: Position,
  allPositions: Position[]
): string {
  const otherSummaries = allPositions
    .filter((p) => p.advisorId !== advisor.id)
    .map((p) => `- ${p.advisorName}: "${p.answer}" — ${p.summary}`)
    .join("\n");

  return `You are roleplaying as the REAL ${advisor.name} (${advisor.role}), continuing the debate. Stay faithful to their actual known views and opinions.

Question: "${question}"

YOUR ROUND 1 ANSWER: ${ownPosition.answer}
YOUR SUMMARY: ${ownPosition.summary}

OTHER ADVISORS' POSITIONS:
${otherSummaries}

Write your rebuttal (200-400 words). You MUST:
1. Who do you disagree with most and why?
2. Did any argument change your mind? Be honest — base this on what ${advisor.name} would actually think.
3. What new insight emerged?
4. End with exactly this format on its own line:
   FINAL ANSWER: [a direct answer to the question in 1-4 words. Same format as the other advisors' answers above. NEVER a sentence or commentary.]

Stay in character as the real ${advisor.name}.`;
}
