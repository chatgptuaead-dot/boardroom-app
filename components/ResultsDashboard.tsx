"use client";

import { useState } from "react";
import { BoardroomSession } from "@/lib/types";
import ExportButton from "./ExportButton";

interface Props {
  session: BoardroomSession;
}

function formatContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

export default function ResultsDashboard({ session }: Props) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [userSliderValues, setUserSliderValues] = useState<Record<number, number>>({});

  const toggleCard = (id: string) => {
    const next = new Set(expandedCards);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCards(next);
  };

  const answerChanges = session.rebuttals.filter((r) => r.answerChanged).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Results</h2>
          <p className="text-muted text-sm mt-1 max-w-xl">
            {session.question}
          </p>
        </div>
        <ExportButton session={session} />
      </div>

      {/* Answer Summary Table */}
      <div className="bg-navy-light rounded-lg border border-border-subtle overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left p-3 text-muted font-medium">Advisor</th>
              <th className="text-left p-3 text-muted font-medium">Round 1 Answer</th>
              <th className="text-left p-3 text-muted font-medium">Final Answer</th>
              <th className="text-center p-3 text-muted font-medium">Changed?</th>
            </tr>
          </thead>
          <tbody>
            {session.advisors.map((advisor) => {
              const pos = session.positions.find(
                (p) => p.advisorId === advisor.id
              );
              const reb = session.rebuttals.find(
                (r) => r.advisorId === advisor.id
              );
              return (
                <tr
                  key={advisor.id}
                  className="border-b border-border-subtle last:border-b-0"
                >
                  <td className="p-3 font-medium">
                    <div>{advisor.name}</div>
                    <div className="text-xs text-muted">{advisor.role}</div>
                  </td>
                  <td className="p-3 text-gold text-xs max-w-48">
                    {pos?.answer}
                  </td>
                  <td className={`p-3 text-xs max-w-48 ${reb?.answerChanged ? "text-gold font-semibold" : "text-muted"}`}>
                    {reb?.finalAnswer}
                  </td>
                  <td className="p-3 text-center">
                    {reb?.answerChanged && (
                      <span className="text-gold font-semibold">Yes</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {answerChanges > 0 && (
        <p className="text-sm text-gold">
          {answerChanges} advisor{answerChanges > 1 ? "s" : ""} changed their answer after the debate.
        </p>
      )}

      {/* Verdict */}
      {(() => {
        // Normalize answers: lowercase, trim, remove punctuation for grouping
        function normalizeAnswer(answer: string): string {
          return answer.toLowerCase().replace(/[.,!?'"]/g, "").replace(/\s+/g, " ").trim();
        }

        // Group similar answers together
        const groups: { display: string; normalized: string; names: string[] }[] = [];
        session.rebuttals.forEach((reb) => {
          const norm = normalizeAnswer(reb.finalAnswer);
          // Check if any existing group's normalized form contains this or vice versa
          const existing = groups.find((g) => {
            return g.normalized === norm ||
              g.normalized.includes(norm) ||
              norm.includes(g.normalized);
          });
          if (existing) {
            existing.names.push(reb.advisorName);
            // Keep the longer display version
            if (reb.finalAnswer.length > existing.display.length) {
              existing.display = reb.finalAnswer;
            }
            // Keep the longer normalized for future matching
            if (norm.length > existing.normalized.length) {
              existing.normalized = norm;
            }
          } else {
            groups.push({ display: reb.finalAnswer, normalized: norm, names: [reb.advisorName] });
          }
        });

        const sortedVotes = groups.sort((a, b) => b.names.length - a.names.length);
        const topVote = sortedVotes[0];
        const total = session.rebuttals.length;

        return (
          <div className="bg-navy-light rounded-lg border border-gold/30 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gold">Board Verdict</h3>
            {topVote && (
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-gold">{topVote.display}</div>
                <div className="text-sm text-muted">
                  {topVote.names.length}/{total} advisors
                </div>
              </div>
            )}
            <div className="space-y-2">
              {sortedVotes.map((group) => (
                <div key={group.display} className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-navy-lighter rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${Math.round((group.names.length / total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-foreground font-medium w-40 truncate">{group.display}</span>
                  <span className="text-xs text-muted w-24 truncate">{group.names.join(", ")}</span>
                  <span className="text-xs text-gold w-6">{group.names.length}</span>
                </div>
              ))}
            </div>
            {session.synthesis?.verdict && (
              <p className="text-sm text-muted leading-relaxed border-t border-border-subtle pt-3">
                {session.synthesis.verdict}
              </p>
            )}
          </div>
        );
      })()}

      {/* Key Tensions */}
      {session.synthesis?.tensions && session.synthesis.tensions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">Key Tensions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {session.synthesis.tensions.map((tension, i) => (
              <div
                key={i}
                className="bg-navy-light rounded-lg border border-border-subtle p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground">{tension.title}</h4>
                </div>
                <p className="text-xs text-gold font-medium">{tension.sides}</p>
                <p className="text-sm text-muted">{tension.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {session.synthesis?.insights && session.synthesis.insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">Key Insights</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {session.synthesis.insights.map((insight, i) => (
              <div
                key={i}
                className="bg-navy-light rounded-lg border border-border-subtle p-4 space-y-2"
              >
                <h4 className="font-semibold text-foreground">{insight.title}</h4>
                <p className="text-sm text-muted">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spectrum Sliders */}
      {session.synthesis?.sliders && session.synthesis.sliders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">Where They Stand</h3>
          <p className="text-sm text-muted">Drag the &quot;You&quot; marker to see where you land relative to the advisors.</p>
          <div className="space-y-6">
            {session.synthesis.sliders.map((slider, i) => {
              const userVal = userSliderValues[i] ?? 50;
              const closestAdvisor = slider.advisorPositions.reduce((closest, ap) =>
                Math.abs(ap.value - userVal) < Math.abs(closest.value - userVal) ? ap : closest
              , slider.advisorPositions[0]);

              return (
                <div
                  key={i}
                  className="bg-navy-light rounded-lg border border-border-subtle p-4 space-y-3"
                >
                  <h4 className="font-semibold text-foreground text-sm">
                    {slider.label}
                  </h4>
                  <div className="relative">
                    <div className="flex justify-between text-xs text-muted mb-2">
                      <span>{slider.leftLabel}</span>
                      <span>{slider.rightLabel}</span>
                    </div>
                    {/* Advisor dots row */}
                    <div className="relative h-8 bg-navy-lighter rounded-full">
                      <div className="absolute inset-0 flex items-center px-1">
                        <div className="w-full h-1 bg-border-subtle rounded-full" />
                      </div>
                      {slider.advisorPositions.map((ap, j) => (
                        <div
                          key={j}
                          className="absolute top-1/2 -translate-y-1/2 group"
                          style={{ left: `${Math.max(2, Math.min(98, ap.value))}%` }}
                        >
                          <div className="w-5 h-5 -ml-2.5 rounded-full bg-gold border-2 border-navy-light flex items-center justify-center text-[8px] font-bold text-navy">
                            {ap.advisorName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-navy-lighter border border-border-subtle rounded text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {ap.advisorName}: {ap.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* User draggable slider */}
                    <div className="mt-2 relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={userVal}
                        onChange={(e) =>
                          setUserSliderValues({ ...userSliderValues, [i]: Number(e.target.value) })
                        }
                        className="w-full h-2 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-purple-500/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-navy-light [&::-webkit-slider-thumb]:-mt-2.5 [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-purple-500/30 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-navy-light"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-purple-400 font-medium">You: {userVal}</span>
                        {closestAdvisor && (
                          <span className="text-xs text-muted">
                            Closest to {closestAdvisor.advisorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Best Match Summary */}
          {Object.keys(userSliderValues).length > 0 && (() => {
            const sliders = session.synthesis!.sliders;
            const advisorNames = new Set<string>();
            sliders.forEach((s) => s.advisorPositions.forEach((ap) => advisorNames.add(ap.advisorName)));

            const scores = Array.from(advisorNames).map((name) => {
              let totalDiff = 0;
              let count = 0;
              sliders.forEach((slider, i) => {
                const userVal = userSliderValues[i];
                if (userVal === undefined) return;
                const ap = slider.advisorPositions.find((a) => a.advisorName === name);
                if (!ap) return;
                totalDiff += Math.abs(ap.value - userVal);
                count++;
              });
              return { name, avgDiff: count > 0 ? totalDiff / count : 100 };
            });

            scores.sort((a, b) => a.avgDiff - b.avgDiff);
            const best = scores[0];
            const worst = scores[scores.length - 1];

            if (!best) return null;

            const matchPct = Math.round(100 - best.avgDiff);

            return (
              <div className="bg-navy-light rounded-lg border border-purple-500/30 p-6 mt-6">
                <h3 className="text-lg font-bold text-purple-400 mb-3">Your Best Match</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
                    {best.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">{best.name}</p>
                    <p className="text-sm text-purple-400">{matchPct}% alignment with your values</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {scores.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-32 truncate">{s.name}</span>
                      <div className="flex-1 h-2 bg-navy-lighter rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${i === 0 ? "bg-purple-500" : "bg-border-subtle"}`}
                          style={{ width: `${Math.round(100 - s.avgDiff)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-10 text-right">{Math.round(100 - s.avgDiff)}%</span>
                    </div>
                  ))}
                </div>
                {worst && best.name !== worst.name && (
                  <p className="text-xs text-muted mt-3">
                    You diverge most from {worst.name} ({Math.round(100 - worst.avgDiff)}% alignment)
                  </p>
                )}

                {/* Your Decision */}
                {(() => {
                  // Find the best matching advisor's final answer
                  const bestReb = session.rebuttals.find((r) => r.advisorName === best.name);
                  const bestPos = session.positions.find((p) => p.advisorName === best.name);
                  const bestAnswer = bestReb?.finalAnswer || bestPos?.answer;

                  // Weighted answer across all advisors, grouped by similarity
                  function normAnswer(a: string): string {
                    return a.toLowerCase().replace(/[.,!?'"]/g, "").replace(/\s+/g, " ").trim();
                  }

                  const answerGroups: { display: string; norm: string; weight: number }[] = [];
                  scores.forEach((s) => {
                    const reb = session.rebuttals.find((r) => r.advisorName === s.name);
                    const pos = session.positions.find((p) => p.advisorName === s.name);
                    const answer = reb?.finalAnswer || pos?.answer || "";
                    const weight = Math.max(0, 100 - s.avgDiff);
                    const norm = normAnswer(answer);
                    if (!norm) return;
                    const existing = answerGroups.find((g) =>
                      g.norm === norm || g.norm.includes(norm) || norm.includes(g.norm)
                    );
                    if (existing) {
                      existing.weight += weight;
                      if (answer.length > existing.display.length) existing.display = answer;
                      if (norm.length > existing.norm.length) existing.norm = norm;
                    } else {
                      answerGroups.push({ display: answer.trim(), norm, weight });
                    }
                  });

                  const sortedAnswers = answerGroups.sort((a, b) => b.weight - a.weight);
                  const topAnswer = sortedAnswers[0]?.display || bestAnswer;
                  const totalWeight = sortedAnswers.reduce((sum, g) => sum + g.weight, 0);

                  return (
                    <div className="mt-6 p-5 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <h4 className="text-sm font-medium text-purple-400 mb-2">Based on your values, your decision should be:</h4>
                      <p className="text-2xl font-bold text-foreground">{topAnswer}</p>
                      <div className="mt-3 space-y-1">
                        {sortedAnswers.slice(0, 3).map((group) => {
                          const pct = totalWeight > 0 ? Math.round(group.weight / totalWeight * 100) : 0;
                          return (
                            <div key={group.display} className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-navy-lighter rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted w-28 truncate text-right">{group.display}</span>
                              <span className="text-xs text-purple-400 w-8">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      )}

      {/* Advisor Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Full Positions & Rebuttals</h3>
        {session.advisors.map((advisor) => {
          const pos = session.positions.find(
            (p) => p.advisorId === advisor.id
          );
          const reb = session.rebuttals.find(
            (r) => r.advisorId === advisor.id
          );
          const isExpanded = expandedCards.has(advisor.id);

          return (
            <div
              key={advisor.id}
              className="bg-navy-light rounded-lg border border-border-subtle overflow-hidden"
            >
              <button
                onClick={() => toggleCard(advisor.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-navy-lighter transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-dim flex items-center justify-center text-gold font-semibold">
                    {advisor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{advisor.name}</p>
                    <p className="text-xs text-muted">{advisor.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gold max-w-64 text-right line-clamp-1">
                    {reb?.finalAnswer || pos?.answer}
                  </span>
                  {reb?.answerChanged && (
                    <span className="text-xs text-gold bg-gold-dim px-2 py-0.5 rounded">
                      Changed
                    </span>
                  )}
                  <span
                    className={`text-muted transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-fade-in">
                  {pos && (
                    <div>
                      <h4 className="text-sm font-semibold text-gold mb-2">
                        Round 1 Position
                      </h4>
                      <div
                        className="advisor-content text-sm text-muted"
                        dangerouslySetInnerHTML={{
                          __html: formatContent(pos.content),
                        }}
                      />
                    </div>
                  )}
                  {reb && (
                    <div className="border-t border-border-subtle pt-4">
                      <h4 className="text-sm font-semibold text-gold mb-2">
                        Round 2 Rebuttal
                        {reb.answerChanged && (
                          <span className="ml-2 text-xs text-gold bg-gold-dim px-2 py-0.5 rounded">
                            Answer changed!
                          </span>
                        )}
                      </h4>
                      <div
                        className="advisor-content text-sm text-muted"
                        dangerouslySetInnerHTML={{
                          __html: formatContent(reb.content),
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
