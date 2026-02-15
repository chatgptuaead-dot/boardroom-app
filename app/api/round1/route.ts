import { NextResponse } from "next/server";
import { generateText } from "@/lib/claude";
import { round1Prompt } from "@/lib/prompts";
import { Advisor, Position } from "@/lib/types";

function cleanAnswer(raw: string): string {
  let answer = raw.trim();
  // Strip markdown bold markers
  answer = answer.replace(/\*\*/g, "");
  // Remove trailing punctuation
  answer = answer.replace(/[.,!?;:]+$/g, "");
  // Truncate to first 4 words max (catches sentences)
  const words = answer.split(/\s+/);
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
