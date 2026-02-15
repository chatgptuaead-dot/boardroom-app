import { NextResponse } from "next/server";
import { generateText } from "@/lib/claude";
import { round1Prompt } from "@/lib/prompts";
import { Advisor, Position } from "@/lib/types";

export const maxDuration = 300;

function cleanAnswer(raw: string): string {
  let answer = raw.trim();
  // Strip markdown bold markers
  answer = answer.replace(/\*\*/g, "");
  // Remove trailing punctuation
  answer = answer.replace(/[.,!?;:]+$/g, "");
  // Remove leading filler phrases
  answer = answer.replace(/^(of course,?\s*|obviously,?\s*|ultimately,?\s*|well,?\s*|i think\s*|i believe\s*|it's\s+|there's\s+)/i, "");
  // Truncate to first 3 words max
  const words = answer.split(/\s+/).filter(Boolean);
  if (words.length > 4) answer = words.slice(0, 4).join(" ");
  // Lowercase
  answer = answer.toLowerCase();
  return answer;
}

function parseAnswer(text: string): string {
  const match = text.match(/ANSWER:\s*(.+)/i);
  if (match) return cleanAnswer(match[1]);
  const lines = text.trim().split("\n").filter((l) => l.trim());
  return cleanAnswer(lines[lines.length - 1] || "no clear answer given");
}

function extractSummary(text: string): string {
  // Remove the ANSWER: line before summarizing
  const cleaned = text.replace(/^ANSWER:.*$/im, "").trim();
  const paragraphs = cleaned
    .split("\n\n")
    .filter((p) => p.trim().length > 50);
  if (paragraphs.length > 1) {
    // Take first two paragraphs for more detail
    const combined = paragraphs.slice(0, 2).map((p) => p.replace(/^[#*]+\s*/, "").trim()).join(" ");
    return combined.length > 400 ? combined.substring(0, 400) + "..." : combined;
  }
  if (paragraphs.length === 1) {
    const first = paragraphs[0].replace(/^[#*]+\s*/, "").trim();
    return first.length > 400 ? first.substring(0, 400) + "..." : first;
  }
  return cleaned.substring(0, 400) + "...";
}

export async function POST(request: Request) {
  try {
    const { question, advisors, context } = await request.json();

    if (!question || !advisors?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const positions: Position[] = [];
    for (const advisor of advisors) {
      if (positions.length > 0) {
        await new Promise((r) => setTimeout(r, 8000));
      }
      const prompt = round1Prompt(advisor, question, context);
      const content = await generateText(prompt, 1024);
      const answer = parseAnswer(content);
      positions.push({
        advisorId: advisor.id,
        advisorName: advisor.name,
        content,
        answer,
        summary: extractSummary(content),
      });
    }
    return NextResponse.json({ positions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
