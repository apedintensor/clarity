"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  running: boolean;
}

export function Timer({ running }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className="font-mono text-sm text-[var(--muted)]">
      {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}
