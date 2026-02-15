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
  return `You are ${advisor.name} (${advisor.role}). ${advisor.personality}
Frameworks: ${advisor.frameworks}

Question: "${question}"
${context ? `Context: ${context}\n` : ""}
Write your position (300-500 words). You MUST:
1. DIRECTLY ANSWER first — commit to a clear answer upfront
2. MAKE YOUR CASE with evidence and reasoning from your real expertise
3. ACKNOWLEDGE TRADEOFFS briefly
4. End with: ANSWER: [your answer in 1-5 words MAX. Examples: "Messi", "Yes", "Bitcoin", "Go for it". NEVER a full sentence.]

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

  return `You are ${advisor.name} (${advisor.role}), continuing the debate.

Question: "${question}"

YOUR ROUND 1 ANSWER: ${ownPosition.answer}
YOUR SUMMARY: ${ownPosition.summary}

OTHER ADVISORS' POSITIONS:
${otherSummaries}

Write your rebuttal (200-400 words). You MUST:
1. Who do you disagree with most and why?
2. Did any argument change your mind? Be honest.
3. What new insight emerged?
4. End with: FINAL ANSWER: [your answer in 1-5 words MAX. NEVER a full sentence.]

Stay in character.`;
}
