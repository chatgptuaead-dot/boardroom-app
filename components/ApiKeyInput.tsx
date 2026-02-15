"use client";

import { useState } from "react";

interface Props {
  onValidated: (apiKey: string) => void;
  initialKey?: string;
}

export default function ApiKeyInput({ onValidated, initialKey }: Props) {
  const [apiKey, setApiKey] = useState(initialKey || "");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  const handleValidate = async () => {
    if (!apiKey.trim()) return;
    setValidating(true);
    setError("");

    try {
      const res = await fetch("/api/round1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          question: "test",
          advisors: [],
        }),
      });

      // A 400 "missing required fields" means the key format is fine but we sent empty advisors.
      // A 500 with auth error means bad key.
      if (res.status === 400) {
        // Key is valid (request was understood, just missing data)
        localStorage.setItem("boardroom-api-key", apiKey.trim());
        onValidated(apiKey.trim());
      } else {
        const data = await res.json();
        if (
          data.error?.includes("auth") ||
          data.error?.includes("API key") ||
          data.error?.includes("401")
        ) {
          setError("Invalid API key. Please check and try again.");
        } else {
          // Likely valid key, other error
          localStorage.setItem("boardroom-api-key", apiKey.trim());
          onValidated(apiKey.trim());
        }
      }
    } catch {
      setError("Failed to validate. Check your connection and try again.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold">Enter your Anthropic API Key</h2>
      <p className="text-muted text-sm">
        Your key is only used for this session and never stored on our servers.
        It&apos;s saved in your browser&apos;s localStorage for convenience.
      </p>
      <div className="flex gap-3">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          placeholder="sk-ant-..."
          className="flex-1 px-4 py-3 bg-navy-lighter border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-foreground placeholder:text-muted/50"
        />
        <button
          onClick={handleValidate}
          disabled={validating || !apiKey.trim()}
          className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? "Validating..." : "Continue"}
        </button>
      </div>
      {error && <p className="text-vote-red text-sm">{error}</p>}
    </div>
  );
}
