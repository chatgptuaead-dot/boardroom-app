import { NextResponse } from "next/server";
import { generateText } from "@/lib/claude";
import { Advisor, Position, Rebuttal } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { question, advisors, positions, rebuttals } = await request.json();

    if (!question || !advisors?.length || !positions?.length || !rebuttals?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const advisorSummaries = advisors
      .map((a: Advisor) => {
        const pos = positions.find((p: Position) => p.advisorId === a.id);
        const reb = rebuttals.find((r: Rebuttal) => r.advisorId === a.id);
        return `${a.name} (${a.role}):
  Round 1 answer: ${pos?.answer || "N/A"}
  Final answer: ${reb?.finalAnswer || pos?.answer || "N/A"}
  Changed: ${reb?.answerChanged ? "Yes" : "No"}
  Round 1 position summary: ${pos?.summary || "N/A"}
  Round 2 rebuttal summary: ${reb?.summary || "N/A"}`;
      })
      .join("\n\n");

    const prompt = `You just observed a boardroom debate on this question:
"${question}"

Here are the advisors and their positions:

${advisorSummaries}

Analyze the debate and produce a JSON object with this exact structure (no markdown, just JSON):

{
  "tensions": [
    {
      "title": "Short title of the disagreement (3-6 words)",
      "sides": "Name A vs Name B",
      "description": "1-2 sentences explaining the core disagreement"
    }
  ],
  "insights": [
    {
      "title": "Short title of the insight (3-6 words)",
      "description": "1-2 sentences explaining a key insight that emerged from the debate"
    }
  ],
  "sliders": [
    {
      "label": "Name of the spectrum/dimension relevant to this debate",
      "leftLabel": "One extreme (2-4 words)",
      "rightLabel": "Opposite extreme (2-4 words)",
      "advisorPositions": [
        { "advisorName": "Full Name", "value": 75 }
      ]
    }
  ],
  "verdict": "2-3 sentence overall synthesis of where the board landed"
}

Rules:
- Generate 2-4 tensions (the biggest disagreements)
- Generate 2-4 insights (the most interesting things that emerged)
- Generate 3-5 sliders with spectrums relevant to THIS specific debate topic. Each slider should have ALL advisors positioned on it (value 0-100, where 0 = far left label, 100 = far right label)
- The verdict should summarize the debate outcome honestly
- Return ONLY the JSON object, no other text`;

    const rawResponse = await generateText(prompt, 1500);
    const response = rawResponse.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse synthesis" },
        { status: 500 }
      );
    }

    const synthesis = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ synthesis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
