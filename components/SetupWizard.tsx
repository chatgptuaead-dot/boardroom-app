"use client";

import { useState } from "react";
import { Advisor } from "@/lib/types";

interface Props {
  onComplete: (config: {
    question: string;
    context: string;
    advisors: Advisor[];
  }) => void;
}

type Step = "question" | "board" | "advisors" | "review";

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("question");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [boardSize, setBoardSize] = useState(5);
  const [seedNames, setSeedNames] = useState<string[]>(["", ""]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [generating, setGenerating] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const addSeedName = () => setSeedNames([...seedNames, ""]);
  const removeSeedName = (i: number) => {
    if (seedNames.length <= 2) return;
    setSeedNames(seedNames.filter((_, idx) => idx !== i));
  };
  const updateSeedName = (i: number, val: string) => {
    const updated = [...seedNames];
    updated[i] = val;
    setSeedNames(updated);
  };

  const generateAdvisors = async () => {
    const validSeeds = seedNames.filter((n) => n.trim());
    if (validSeeds.length < 2) {
      setError("Please enter at least 2 seeds.");
      return;
    }
    if (boardSize < validSeeds.length) {
      setError("Board size must be at least equal to the number of seeds.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-advisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          seedAdvisors: validSeeds,
          boardSize,
          context: context || undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setAdvisors(data.advisors);
      setStep("review");
    } catch {
      setError("Failed to generate advisors. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const replaceAdvisor = async (id: string) => {
    setReplacingId(id);
    setError("");

    try {
      const res = await fetch("/api/replace-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          currentAdvisors: advisors,
          replacingId: id,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }

      setAdvisors(
        advisors.map((a) => (a.id === id ? data.advisor : a))
      );
    } catch {
      setError("Failed to replace advisor. Please try again.");
    } finally {
      setReplacingId(null);
    }
  };

  const updateAdvisor = (id: string, field: keyof Advisor, value: string) => {
    setAdvisors(
      advisors.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const removeAdvisor = (id: string) => {
    if (advisors.length <= 3) return;
    setAdvisors(advisors.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Progress bar */}
      <div className="flex gap-2">
        {(["question", "board", "advisors", "review"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              (["question", "board", "advisors", "review"] as Step[]).indexOf(step) >= i
                ? "bg-gold"
                : "bg-navy-lighter"
            }`}
          />
        ))}
      </div>

      {step === "question" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">What question needs debating?</h2>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Who is the greatest football player of all time?"
            rows={3}
            className="w-full px-4 py-3 bg-navy-lighter border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-foreground placeholder:text-muted/50 resize-none"
          />
          <div>
            <label className="block text-sm text-muted mb-2">
              Additional context (optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Paste any relevant background, data, constraints..."
              rows={4}
              className="w-full px-4 py-3 bg-navy-lighter border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-foreground placeholder:text-muted/50 resize-none"
            />
          </div>
          <button
            onClick={() => setStep("board")}
            disabled={!question.trim()}
            className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === "board" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Configure your board</h2>
          <div>
            <label className="block text-sm text-muted mb-2">
              Board size: {boardSize} advisors
            </label>
            <input
              type="range"
              min={3}
              max={10}
              value={boardSize}
              onChange={(e) => setBoardSize(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>3 (focused)</span>
              <span>10 (diverse)</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("question")}
              className="px-6 py-3 border border-border-subtle text-muted rounded-lg hover:border-gold hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("advisors")}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === "advisors" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Seed your advisors</h2>
          <p className="text-sm text-muted">
            Enter real names or describe the type of advisor you want. AI will
            fill the remaining{" "}
            {Math.max(0, boardSize - seedNames.filter((n) => n.trim()).length)}{" "}
            seats with diverse perspectives.
          </p>
          <div className="space-y-3">
            {seedNames.map((name, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updateSeedName(i, e.target.value)}
                  placeholder={
                    i === 0
                      ? 'A name (e.g., "Pep Guardiola") or a type (e.g., "a football coach")'
                      : i === 1
                      ? 'e.g., "Warren Buffett" or "a philosopher"'
                      : `Advisor ${i + 1}`
                  }
                  className="flex-1 px-4 py-2.5 bg-navy-lighter border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-foreground placeholder:text-muted/50"
                />
                {seedNames.length > 2 && (
                  <button
                    onClick={() => removeSeedName(i)}
                    className="px-3 text-muted hover:text-vote-red transition-colors"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
          {seedNames.length < boardSize && (
            <button
              onClick={addSeedName}
              className="text-sm text-gold hover:text-yellow-400 transition-colors"
            >
              + Add another seed
            </button>
          )}
          {error && <p className="text-vote-red text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("board")}
              className="px-6 py-3 border border-border-subtle text-muted rounded-lg hover:border-gold hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              onClick={generateAdvisors}
              disabled={generating}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {generating ? "Generating board..." : "Generate Board"}
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Review your board</h2>
          <p className="text-sm text-muted">
            Edit profiles, replace advisors you don&apos;t want, or remove them.
          </p>
          {error && <p className="text-vote-red text-sm">{error}</p>}
          <div className="space-y-3">
            {advisors.map((advisor) => (
              <div
                key={advisor.id}
                className={`p-4 bg-navy-lighter border border-border-subtle rounded-lg space-y-2 transition-opacity ${
                  replacingId === advisor.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <input
                    value={advisor.name}
                    onChange={(e) =>
                      updateAdvisor(advisor.id, "name", e.target.value)
                    }
                    className="font-semibold bg-transparent border-none focus:outline-none text-foreground text-lg"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-gold-dim text-gold rounded">
                      {advisor.role}
                    </span>
                    <button
                      onClick={() => replaceAdvisor(advisor.id)}
                      disabled={replacingId !== null}
                      className="text-muted hover:text-gold text-sm transition-colors disabled:opacity-50"
                    >
                      {replacingId === advisor.id ? "Replacing..." : "Replace"}
                    </button>
                    {advisors.length > 3 && (
                      <button
                        onClick={() => removeAdvisor(advisor.id)}
                        className="text-muted hover:text-vote-red text-sm transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={advisor.personality}
                  onChange={(e) =>
                    updateAdvisor(advisor.id, "personality", e.target.value)
                  }
                  rows={2}
                  className="w-full text-sm text-muted bg-transparent border-none focus:outline-none resize-none"
                />
                <p className="text-xs text-muted/70">
                  Frameworks: {advisor.frameworks}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("advisors")}
              className="px-6 py-3 border border-border-subtle text-muted rounded-lg hover:border-gold hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => onComplete({ question, context, advisors })}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Start Debate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
