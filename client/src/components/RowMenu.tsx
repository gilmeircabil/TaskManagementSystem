import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useDismiss } from '../hooks/useDismiss';
import { IconDots } from './Icons';

export interface RowAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
}

const MENU_WIDTH = 168;

/**
 * "⋯" row-actions menu. Rendered with fixed positioning so it is never clipped
 * by the horizontally-scrolling table container.
 */
export function RowMenu({ actions, label }: { actions: RowAction[]; label: string }) {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setStyle(null), []);
  useDismiss([btnRef, menuRef], close, style !== null);

  const toggle = () => {
    if (style) return close();
    const r = btnRef.current!.getBoundingClientRect();
    const estimatedHeight = actions.length * 40 + 12;
    const top = r.bottom + estimatedHeight + 8 > window.innerHeight ? r.top - estimatedHeight - 4 : r.bottom + 4;
    setStyle({ position: 'fixed', top, left: Math.max(8, r.right - MENU_WIDTH), width: MENU_WIDTH });
    const onMove = () => {
      setStyle(null);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={style !== null}
        onClick={toggle}
      >
        <IconDots />
      </button>
      {style && (
        <div ref={menuRef} className="dropdown row-menu" style={style} role="menu">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              className={`menu-item ${a.danger ? 'menu-item-danger' : ''}`}
              onClick={() => {
                close();
                a.onClick();
              }}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
