import { NextResponse } from "next/server";
import { generateText } from "@/lib/claude";
import { advisorGenerationPrompt } from "@/lib/prompts";
import { Advisor } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { question, seedAdvisors, boardSize, context } =
      await request.json();

    if (!question || !seedAdvisors?.length || !boardSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = advisorGenerationPrompt(
      question,
      seedAdvisors,
      boardSize,
      context
    );

    const rawResponse = await generateText(prompt, 1500);
    const response = rawResponse.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();

    let jsonStr = response.match(/\[[\s\S]*\]/)?.[0];

    // If no closing bracket found, the response was likely truncated — try to fix it
    if (!jsonStr) {
      const arrStart = response.indexOf("[");
      if (arrStart !== -1) {
        let truncated = response.substring(arrStart);
        // Find the last complete object (ends with })
        const lastBrace = truncated.lastIndexOf("}");
        if (lastBrace !== -1) {
          truncated = truncated.substring(0, lastBrace + 1) + "]";
          jsonStr = truncated;
        }
      }
    }

    if (!jsonStr) {
      console.error("Failed to parse advisor profiles. Raw response:", rawResponse);
      return NextResponse.json(
        { error: "Failed to parse advisor profiles" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonStr);
    const advisors: Advisor[] = parsed.map(
      (
        a: { name: string; role: string; personality: string; frameworks: string | string[] },
        i: number
      ) => ({
        id: `advisor-${i}`,
        name: a.name,
        role: a.role,
        personality: a.personality,
        frameworks: Array.isArray(a.frameworks) ? a.frameworks.join(", ") : a.frameworks,
      })
    );

    return NextResponse.json({ advisors });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Generate advisors error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
