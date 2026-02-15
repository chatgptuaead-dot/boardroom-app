"use client";

import { Advisor, Position, Rebuttal } from "@/lib/types";

interface Props {
  round: 1 | 2;
  advisors: Advisor[];
  positions: Position[];
  rebuttals: Rebuttal[];
  loading: boolean;
  error?: string;
}

export default function ExecutionView({
  round,
  advisors,
  positions,
  rebuttals,
  loading,
  error,
}: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">
          Round {round}: {round === 1 ? "Position Memos" : "Rebuttals"}
        </h2>
        {loading && (
          <div className="flex items-center gap-2 text-gold text-sm">
            <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            {round === 1
              ? "Advisors are writing their positions..."
              : "Advisors are reading each other and writing rebuttals..."}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-vote-red/10 border border-vote-red/30 rounded-lg text-vote-red">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {advisors.map((advisor, i) => {
          const position = positions.find((p) => p.advisorId === advisor.id);
          const rebuttal = rebuttals.find((r) => r.advisorId === advisor.id);
          const data = round === 1 ? position : rebuttal;
          const isComplete = !!data;

          const answer =
            round === 1 ? position?.answer : rebuttal?.finalAnswer;

          return (
            <div
              key={advisor.id}
              className={`p-4 rounded-lg border transition-all ${
                isComplete
                  ? "bg-navy-light border-border-subtle animate-fade-in"
                  : "bg-navy-lighter border-border-subtle opacity-50"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold-dim flex items-center justify-center text-gold font-semibold text-sm">
                    {advisor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{advisor.name}</p>
                    <p className="text-xs text-muted">{advisor.role}</p>
                  </div>
                </div>
              </div>

              {isComplete ? (
                <div>
                  <p className="text-sm font-medium text-gold mb-1 line-clamp-2">
                    {answer}
                  </p>
                  <p className="text-xs text-muted line-clamp-2">
                    {data?.summary}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="h-2 bg-navy-lighter rounded-full w-3/4 animate-pulse" />
                  <div className="h-2 bg-navy-lighter rounded-full w-1/2 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
