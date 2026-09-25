"use client";

import { useState, useTransition } from "react";
import { setRating } from "@/actions/reading";

function Star({ fillPercent }: { fillPercent: number }) {
  return (
    <span className="relative inline-block h-6 w-6">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-dust-line" fill="currentColor">
        <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.1-.6z" />
      </svg>
      <span
        className="absolute inset-0 overflow-hidden text-marigold"
        style={{ width: `${fillPercent}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.1-.6z" />
        </svg>
      </span>
    </span>
  );
}

export function StarRating({
  sessionId,
  ratingHalf,
}: {
  sessionId: string;
  ratingHalf: number | null;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const currentValue = ratingHalf ? ratingHalf / 2 : 0;
  const displayValue = hoverValue ?? currentValue;

  function select(halfSteps: number) {
    const formData = new FormData();
    formData.set("sessionId", sessionId);
    formData.set("ratingHalf", String(halfSteps));
    startTransition(() => {
      setRating(formData);
    });
  }

  return (
    <div
      className="flex items-center gap-2"
      onMouseLeave={() => setHoverValue(null)}
      aria-label={`Nota: ${currentValue} de 5 estrelas`}
    >
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillPercent = Math.max(0, Math.min(1, displayValue - (star - 1))) * 100;
          return (
            <span key={star} className="relative">
              <Star fillPercent={fillPercent} />
              <button
                type="button"
                disabled={pending}
                aria-label={`${star - 0.5} estrelas`}
                className="absolute inset-y-0 left-0 w-1/2"
                onMouseEnter={() => setHoverValue(star - 0.5)}
                onClick={() => select((star - 0.5) * 2)}
              />
              <button
                type="button"
                disabled={pending}
                aria-label={`${star} estrelas`}
                className="absolute inset-y-0 right-0 w-1/2"
                onMouseEnter={() => setHoverValue(star)}
                onClick={() => select(star * 2)}
              />
            </span>
          );
        })}
      </div>
      <span className="text-sm text-ink-soft">
        {currentValue > 0 ? `${currentValue.toFixed(1)} / 5` : "Sem nota"}
      </span>
    </div>
  );
}
