import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface SuccessAnimationProps {
  show: boolean;
  onComplete: () => void;
}

export function SuccessAnimation({ show, onComplete }: SuccessAnimationProps) {
  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        setTimeout(onComplete, 500);
      }
    };

    frame();
  }, [onComplete]);

  useEffect(() => {
    if (show) {
      fireConfetti();
    }
  }, [show, fireConfetti]);

  return null;
}
