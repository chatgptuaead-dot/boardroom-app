const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";
const MAX_RETRIES = 6;

export async function generateText(
  prompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const body = await response.text();
          const retryMatch = body.match(/try again in (\d+\.?\d*)s/i) || body.match(/"retry_after":\s*(\d+\.?\d*)/);
          const waitSecs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 1 : 30;
          console.log(`Rate limited. Waiting ${waitSecs}s before retry ${attempt + 1}/${MAX_RETRIES}...`);
          await new Promise((r) => setTimeout(r, waitSecs * 1000));
          continue;
        }
        throw new Error("Rate limited. Please try again in a moment.");
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API error (${response.status}): ${err}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content || content.trim().length === 0) {
        throw new Error("Empty response from API");
      }

      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES && !lastError.message.includes("Rate limited.")) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Failed after retries");
}
