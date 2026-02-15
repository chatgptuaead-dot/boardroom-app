import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-gold">Boardroom</span>
          </h1>
          <p className="text-xl text-muted">
            AI-powered advisory board debates with real public figures
          </p>
        </div>

        <div className="space-y-4 text-muted text-left bg-navy-light rounded-xl p-6 border border-border-subtle">
          <p>
            Assemble a board of real advisors — thinkers, leaders, contrarians —
            and watch them debate your toughest decisions in two rounds of
            structured argument.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">1.</span>
              <span>Choose your question and seed 2+ advisors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">2.</span>
              <span>
                AI fills the remaining seats with diverse perspectives
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">3.</span>
              <span>
                Round 1: Each advisor writes a position memo with a vote
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">4.</span>
              <span>
                Round 2: They read each other&apos;s positions and write rebuttals
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">5.</span>
              <span>
                See who changed their mind, where the tensions lie, and export
                the full debate
              </span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/boardroom"
            className="inline-block px-8 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-500 transition-colors text-lg"
          >
            Start a Boardroom
          </Link>
          <p className="text-xs text-muted">
            Completely free. No account or API key needed.
          </p>
        </div>
      </div>
    </div>
  );
}
