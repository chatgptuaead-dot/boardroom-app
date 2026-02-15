"use client";

import { useState } from "react";
import {
  Advisor,
  Position,
  Rebuttal,
  Synthesis,
  BoardroomSession,
} from "@/lib/types";
import SetupWizard from "@/components/SetupWizard";
import ExecutionView from "@/components/ExecutionView";
import ResultsDashboard from "@/components/ResultsDashboard";

type Phase = "setup" | "round1" | "round2" | "synthesizing" | "results";

export default function BoardroomPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [rebuttals, setRebuttals] = useState<Rebuttal[]>([]);
  const [synthesis, setSynthesis] = useState<Synthesis | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetupComplete = async (config: {
    question: string;
    context: string;
    advisors: Advisor[];
  }) => {
    setQuestion(config.question);
    setContext(config.context);
    setAdvisors(config.advisors);
    setPhase("round1");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/round1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: config.question,
          advisors: config.advisors,
          context: config.context || undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setPositions(data.positions);
      setLoading(false);

      // Round 2
      setPhase("round2");
      setLoading(true);

      const r2res = await fetch("/api/round2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: config.question,
          advisors: config.advisors,
          positions: data.positions,
        }),
      });

      const r2data = await r2res.json();
      if (r2data.error) {
        setError(r2data.error);
        setLoading(false);
        return;
      }

      setRebuttals(r2data.rebuttals);
      setLoading(false);

      // Synthesis
      setPhase("synthesizing");
      setLoading(true);

      const synthRes = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: config.question,
          advisors: config.advisors,
          positions: data.positions,
          rebuttals: r2data.rebuttals,
        }),
      });

      const synthData = await synthRes.json();
      if (!synthData.error) {
        setSynthesis(synthData.synthesis);
      }

      setLoading(false);
      setPhase("results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setLoading(false);
    }
  };

  const session: BoardroomSession = {
    question,
    context: context || undefined,
    advisors,
    positions,
    rebuttals,
    synthesis,
  };

  const startOver = () => {
    setPhase("setup");
    setQuestion("");
    setContext("");
    setAdvisors([]);
    setPositions([]);
    setRebuttals([]);
    setSynthesis(undefined);
    setError("");
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-gold font-bold text-lg">
            Boardroom
          </a>
          {phase !== "setup" && (
            <button
              onClick={startOver}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              New Session
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {phase === "setup" && (
          <SetupWizard onComplete={handleSetupComplete} />
        )}

        {phase === "round1" && (
          <ExecutionView
            round={1}
            advisors={advisors}
            positions={positions}
            rebuttals={rebuttals}
            loading={loading}
            error={error}
          />
        )}

        {phase === "round2" && (
          <ExecutionView
            round={2}
            advisors={advisors}
            positions={positions}
            rebuttals={rebuttals}
            loading={loading}
            error={error}
          />
        )}

        {phase === "synthesizing" && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-gold font-medium">
              Analyzing the debate and generating insights...
            </p>
          </div>
        )}

        {phase === "results" && <ResultsDashboard session={session} />}
      </main>
    </div>
  );
}
