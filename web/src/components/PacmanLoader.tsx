const DOT_COUNT = 6;
const DURATION = 2.4;

export function PacmanLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-4">
      <div className="pacman-track">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <span
            key={i}
            className="pacman-coin"
            style={{ left: `${28 + i * 34}px`, animationDelay: `${(i / DOT_COUNT) * DURATION}s` }}
          >
            ₹
          </span>
        ))}
        <div className="pacman">
          <span className="pacman-top" />
          <span className="pacman-bottom" />
        </div>
      </div>
      {label && <p className="text-sm text-[var(--muted)]">{label}</p>}
      <style>{`
        .pacman-track {
          position: relative;
          width: 240px;
          height: 40px;
        }
        .pacman-coin {
          position: absolute;
          top: 2px;
          font-size: 15px;
          font-weight: 700;
          color: var(--accent);
          animation: pacman-eat ${DURATION}s infinite linear;
        }
        @keyframes pacman-eat {
          0%, 14% { opacity: 1; transform: scale(1); }
          18%, 100% { opacity: 0; transform: scale(0.2); }
        }
        .pacman {
          position: absolute;
          top: 0;
          left: 0;
          width: 32px;
          height: 32px;
          animation: pacman-move ${DURATION}s infinite linear;
        }
        @keyframes pacman-move {
          0% { left: 0; }
          100% { left: 208px; }
        }
        .pacman-top, .pacman-bottom {
          position: absolute;
          width: 0;
          height: 0;
          border-top: 16px solid #f5b400;
          border-left: 16px solid #f5b400;
          border-bottom: 16px solid transparent;
          border-right: 16px solid transparent;
          border-radius: 16px;
        }
        .pacman-top { animation: pacman-chomp-top 0.4s infinite; }
        .pacman-bottom { animation: pacman-chomp-bottom 0.4s infinite; }
        @keyframes pacman-chomp-top {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-40deg); }
        }
        @keyframes pacman-chomp-bottom {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(40deg); }
        }
      `}</style>
    </div>
  );
}
