import { NextResponse } from "next/server";
import { generateText } from "@/lib/claude";
import { round2Prompt } from "@/lib/prompts";
import { Advisor, Position, Rebuttal } from "@/lib/types";

function cleanAnswer(raw: string): string {
  let answer = raw.trim();
  answer = answer.replace(/\*\*/g, "");
  answer = answer.replace(/[.,!?;:]+$/g, "");
  answer = answer.replace(/^(of course,?\s*|obviously,?\s*|ultimately,?\s*|well,?\s*|i think\s*|i believe\s*|it's\s+|there's\s+)/i, "");
  const words = answer.split(/\s+/).filter(Boolean);
  if (words.length > 4) answer = words.slice(0, 4).join(" ");
  answer = answer.toLowerCase();
  return answer;
}

function parseAnswer(text: string): string {
  const finalMatch = text.match(/FINAL\s+ANSWER:\s*(.+)/i);
  if (finalMatch) return cleanAnswer(finalMatch[1]);
  const match = text.match(/ANSWER:\s*(.+)/i);
  if (match) return cleanAnswer(match[1]);
  const lines = text.trim().split("\n").filter((l) => l.trim());
  return cleanAnswer(lines[lines.length - 1] || "no clear answer given");
}

function extractSummary(text: string): string {
  const paragraphs = text
    .split("\n\n")
    .filter((p) => p.trim().length > 50);
  if (paragraphs.length > 0) {
    const first = paragraphs[0].replace(/^[#*]+\s*/, "").trim();
    return first.length > 200 ? first.substring(0, 200) + "..." : first;
  }
  return text.substring(0, 200) + "...";
}

export async function POST(request: Request) {
  try {
    const { question, advisors, positions } = await request.json();

    if (!question || !advisors?.length || !positions?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const rebuttals: Rebuttal[] = [];
    for (const advisor of advisors) {
      if (rebuttals.length > 0) {
        await new Promise((r) => setTimeout(r, 8000));
      }
      const ownPosition = positions.find(
        (p: Position) => p.advisorId === advisor.id
      );
      if (!ownPosition) throw new Error(`No position for ${advisor.name}`);

      const prompt = round2Prompt(advisor, question, ownPosition, positions);
      const content = await generateText(prompt, 768);
      const finalAnswer = parseAnswer(content);

      rebuttals.push({
        advisorId: advisor.id,
        advisorName: advisor.name,
        content,
        finalAnswer,
        answerChanged: (() => {
          const a = finalAnswer.toLowerCase();
          const b = ownPosition.answer.toLowerCase();
          // Same if equal, or one contains the other (e.g. "billie jean" vs "billie jean king")
          return a !== b && !a.includes(b) && !b.includes(a);
        })(),
        summary: extractSummary(content),
      });
    }
    return NextResponse.json({ rebuttals });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
