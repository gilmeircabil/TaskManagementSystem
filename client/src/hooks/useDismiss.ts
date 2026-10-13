import { useEffect, type RefObject } from 'react';

/** Calls `handler` when a mousedown happens outside all given refs, or Escape is pressed. */
export function useDismiss(refs: RefObject<HTMLElement | null>[], handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (refs.every((r) => !r.current?.contains(target))) handler();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, handler]);
}
