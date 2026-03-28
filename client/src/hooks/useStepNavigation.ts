import { useEffect, useCallback } from "react";

/**
 * Hook that intercepts the browser's back button to go to the previous step
 * instead of leaving the app.
 *
 * Usage:
 *   useStepNavigation(step, setStep, { minStep: 1, onExit: () => setLocation("/campaigns") });
 *
 * How it works:
 * - On mount, pushes a dummy history entry so the back button has something to pop.
 * - On each step change, pushes another entry.
 * - When the browser fires 'popstate' (back button), we catch it and go to step - 1.
 * - If already at minStep, we navigate to onExit path.
 */
export function useStepNavigation(
  step: number,
  setStep: (s: number | ((prev: number) => number)) => void,
  options: { minStep?: number; onExit?: () => void } = {}
) {
  const { minStep = 1, onExit } = options;

  const handleBack = useCallback(() => {
    if (step > minStep) {
      setStep(s => s - 1);
      // Push a new state so the next back button press is also caught
      window.history.pushState({ step: step - 1 }, "");
    } else {
      // At first step — let user exit if onExit provided, otherwise push again
      if (onExit) {
        onExit();
      } else {
        // Stay in app — push state to prevent leaving
        window.history.pushState({ step: minStep }, "");
      }
    }
  }, [step, minStep, setStep, onExit]);

  useEffect(() => {
    // Push initial state when component mounts
    window.history.pushState({ step }, "");

    const onPopState = () => {
      handleBack();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [step, handleBack]);
}
