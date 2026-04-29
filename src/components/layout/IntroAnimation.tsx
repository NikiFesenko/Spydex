import { useState, useEffect, useRef } from 'react';

// ─── Decryption helpers ────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function runDecrypt(
  target: string,
  onFrame: (chars: string[]) => void,
  onDone: () => void,
  settleMs = 160,
  tickMs = 50,
): () => void {
  const settled = new Array(target.length).fill(false);
  let settledCount = 0;
  const current: string[] = target.split('').map(() => randomChar());
  let elapsed = 0;
  let handle: ReturnType<typeof setInterval>;

  handle = setInterval(() => {
    elapsed += tickMs;
    const targetSettled = Math.floor(elapsed / settleMs);

    for (let i = 0; i < target.length; i++) {
      if (!settled[i] && i < targetSettled) {
        settled[i] = true;
        current[i] = target[i];
        settledCount++;
      } else if (!settled[i]) {
        current[i] = randomChar();
      }
    }

    onFrame([...current]);

    if (settledCount === target.length) {
      clearInterval(handle);
      onDone();
    }
  }, tickMs);

  return () => clearInterval(handle);
}

function runEncrypt(
  source: string,
  onFrame: (chars: string[]) => void,
  onDone: () => void,
  settleMs = 120,
  tickMs = 50,
): () => void {
  const len = source.length;
  const hidden = new Array(len).fill(false);
  let hiddenCount = 0;
  const current: string[] = source.split('');
  let elapsed = 0;
  let handle: ReturnType<typeof setInterval>;

  handle = setInterval(() => {
    elapsed += tickMs;
    const targetHidden = Math.floor(elapsed / settleMs);

    for (let i = 0; i < len; i++) {
      const distFromEdge = Math.min(i, len - 1 - i);
      if (!hidden[i] && distFromEdge < targetHidden) {
        hidden[i] = true;
        hiddenCount++;
      }
      current[i] = hidden[i] ? randomChar() : source[i];
    }

    onFrame([...current]);

    if (hiddenCount === len) {
      clearInterval(handle);
      onDone();
    }
  }, tickMs);

  return () => clearInterval(handle);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SYMBOL_TARGET = '—∧—';
const NAME_TARGET   = 'ESTANTO';

type Phase =
  | 'symbol-decrypt'
  | 'symbol-hold'
  | 'symbol-encrypt'
  | 'hold'
  | 'outro';

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('symbol-decrypt');
  const [symbolChars, setSymbolChars] = useState<string[]>(
    SYMBOL_TARGET.split('').map(() => randomChar()),
  );
  const [nameChars, setNameChars] = useState<string[]>(
    NAME_TARGET.split('').map(() => ''),
  );
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Dark-mode detection (synced to html.dark class)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark')),
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const cleanupRef = useRef<(() => void) | null>(null);
  const doCleanup = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  };

  useEffect(() => {
    doCleanup();

    // ── Phase 1: Symbol decrypts ──────────────────────────────────────────────
    if (phase === 'symbol-decrypt') {
      cleanupRef.current = runDecrypt(
        SYMBOL_TARGET,
        setSymbolChars,
        () => {
          setSymbolChars(SYMBOL_TARGET.split(''));
          setTimeout(() => setPhase('symbol-hold'), 50);
        },
        160,
        50,
      );
    }

    // ── Phase 2: Hold symbol 2 s ──────────────────────────────────────────────
    if (phase === 'symbol-hold') {
      const t = setTimeout(() => setPhase('symbol-encrypt'), 2000);
      return () => clearTimeout(t);
    }

    // ── Phase 3: Symbol encrypts back; name decrypts simultaneously ───────────
    if (phase === 'symbol-encrypt') {
      let symbolDone = false;
      let nameDone   = false;
      const checkBoth = () => { if (symbolDone && nameDone) setPhase('hold'); };

      const stopSymbol = runEncrypt(
        SYMBOL_TARGET,
        setSymbolChars,
        () => { symbolDone = true; checkBoth(); },
        120, 50,
      );

      const stopName = runDecrypt(
        NAME_TARGET,
        setNameChars,
        () => {
          setNameChars(NAME_TARGET.split(''));
          nameDone = true;
          checkBoth();
        },
        180, 50,
      );

      cleanupRef.current = () => { stopSymbol(); stopName(); };
    }

    // ── Phase 4: Brief hold ───────────────────────────────────────────────────
    if (phase === 'hold') {
      const t = setTimeout(() => setPhase('outro'), 900);
      return () => clearTimeout(t);
    }

    // ── Phase 5: Outro ────────────────────────────────────────────────────────
    if (phase === 'outro') {
      setIsFadingOut(true);
      const t = setTimeout(() => onComplete(), 650);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  // ─── Theme colors ─────────────────────────────────────────────────────────
  const bg             = isDark ? '#0E0E0E'              : '#F5F0E8';
  const symbolSettled  = isDark ? '#FFFFFF'              : '#1A1A1A';
  const nameSettled    = isDark ? '#DDDDDD'              : '#1A1A1A';
  const scrambleSym    = isDark ? 'rgba(255,255,255,0.2)': 'rgba(0,0,0,0.12)';
  const scrambleName   = isDark ? 'rgba(255,255,255,0.18)':'rgba(0,0,0,0.10)';

  // Symbol is visible during decrypt + hold; starts fading once encrypt begins
  const symbolOpacity =
    phase === 'symbol-decrypt' || phase === 'symbol-hold' ? 1 : 0;

  // Name is visible once symbol starts encrypting
  const nameOpacity =
    phase === 'symbol-encrypt' || phase === 'hold' || phase === 'outro' ? 1 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        transition: 'opacity 0.65s ease',
        opacity: isFadingOut ? 0 : 1,
      }}
    >
      {/* ── Single centered slot — symbol & name overlap here ─────────────── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Symbol: — ∧ — */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            gap: '2.4rem',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: 300,
            userSelect: 'none',
            opacity: symbolOpacity,
            transition: 'opacity 0.4s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {symbolChars.map((ch, i) => {
            const isSettled = ch === SYMBOL_TARGET[i];
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  // caret ~10.5 rem, dashes ~6.6 rem (≈3× original)
                  fontSize: i === 1 ? '10.5rem' : '6.6rem',
                  lineHeight: 1,
                  color: isSettled ? symbolSettled : scrambleSym,
                  transition: 'color 0.08s ease',
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* Name: E S T A N T O — sits in exactly the same center */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.4rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 300,
            letterSpacing: '0.55em',
            userSelect: 'none',
            opacity: nameOpacity,
            transition: 'opacity 0.35s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {nameChars.map((ch, i) => {
            const isSettled = ch === NAME_TARGET[i];
            const isEmpty   = ch === '';
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: '3.2rem',        // 3× original ~1.1rem
                  textAlign: 'center',
                  fontSize: '3.15rem',    // 3× original 1.05rem
                  lineHeight: 1,
                  color: isSettled ? nameSettled : scrambleName,
                  transition: 'color 0.08s ease',
                  opacity: isEmpty ? 0 : 1,
                }}
              >
                {isEmpty ? NAME_TARGET[i] : ch}
              </span>
            );
          })}
        </div>

      </div>
    </div>
  );
}
