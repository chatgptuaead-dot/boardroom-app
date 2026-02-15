import { NextResponse } from "next/server";
import { generateText } from "@/lib/claude";
import { Advisor } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { question, currentAdvisors, replacingId } = await request.json();

    if (!question || !currentAdvisors?.length || !replacingId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingNames = currentAdvisors
      .filter((a: Advisor) => a.id !== replacingId)
      .map((a: Advisor) => a.name)
      .join(", ");

    const prompt = `You are designing an advisory board for this question:
"${question}"

The board already has these advisors: ${existingNames}

Generate ONE new advisor to replace a spot on this board. The new advisor must be a real, well-known public figure who is NOT already on the board. Choose someone who brings a different perspective from the existing advisors.

Respond in this exact JSON format (no markdown, just the JSON object):
{
  "name": "Full Name",
  "role": "Their archetype (e.g., Domain Expert, The Contrarian, The Pragmatist, The Humanist, The Radical Thinker, The Systems Thinker, The Devil's Advocate)",
  "personality": "2-3 sentences on how they think, what they prioritize, their cognitive biases/blind spots",
  "frameworks": "Known frameworks or mental models they use"
}

Return ONLY the JSON object, no other text.`;

    const rawResponse = await generateText(prompt, 1024);
    const response = rawResponse.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to generate replacement advisor" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const advisor: Advisor = {
      id: replacingId,
      name: parsed.name,
      role: parsed.role,
      personality: parsed.personality,
      frameworks: parsed.frameworks,
    };

    return NextResponse.json({ advisor });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
