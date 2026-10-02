import { useEffect, useRef } from "react";

export function useDialogFocusReturn() {
  const previouslyFocused = useRef(document.activeElement);

  useEffect(() => {
    const focusTarget = previouslyFocused.current;

    return () => {
      window.requestAnimationFrame(() => {
        if (document.querySelector('[aria-modal="true"]')) return;
        if (focusTarget?.isConnected) {
          focusTarget.focus?.();
        }
      });
    };
  }, []);
}