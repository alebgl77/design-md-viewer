import React, { useCallback, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * The three states the control cycles through. `system` is the absence of a
 * stored choice: no `data-theme` attribute is stamped and src/index.css falls
 * through to `prefers-color-scheme`.
 */
type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface ThemeToggleProps {
  className?: string;
}

/** Shared with the pre-paint bootstrap in index.html. */
const STORAGE_KEY = 'dmve-theme';

const CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

/**
 * Deliberately the LIGHT query, not the dark one: src/index.css treats dark as
 * the default and only switches to light under `prefers-color-scheme: light`.
 * Querying the same condition keeps this control's readout and the stylesheet
 * from ever disagreeing (a `no-preference` OS resolves to dark in both).
 */
const LIGHT_QUERY = '(prefers-color-scheme: light)';

const PREFERENCE_LABELS: Record<ThemePreference, string> = {
  system: 'follow system',
  light: 'light',
  dark: 'dark',
};

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    // Private-mode Safari and hardened browser profiles throw on access.
    return 'system';
  }
}

function systemPrefersLight(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(LIGHT_QUERY).matches;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference);
  const [isSystemLight, setIsSystemLight] = useState<boolean>(systemPrefersLight);

  // Stamp the choice on <html> and persist it. Removing both the attribute and
  // the stored key is what "follow system" means, and it keeps the index.html
  // bootstrap from re-pinning a stale theme on the next load.
  useEffect(() => {
    const root = document.documentElement;

    if (preference === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', preference);
    }

    try {
      if (preference === 'system') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, preference);
      }
    } catch {
      // Persistence is best-effort; the in-session theme still applies.
    }
  }, [preference]);

  // While following the system, the resolved theme can change without any
  // interaction, so the readout has to track the media query too.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia(LIGHT_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsSystemLight(event.matches);

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handleChange);
      return () => query.removeEventListener('change', handleChange);
    }

    return undefined;
  }, []);

  const handleClick = useCallback(() => {
    setPreference((current) => CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]);
  }, []);

  const resolved: ResolvedTheme = preference === 'system' ? (isSystemLight ? 'light' : 'dark') : preference;
  const nextPreference = CYCLE[(CYCLE.indexOf(preference) + 1) % CYCLE.length];
  const Icon = resolved === 'light' ? Sun : Moon;

  const state =
    preference === 'system'
      ? `follow system, currently ${resolved}`
      : `${PREFERENCE_LABELS[preference]}, set manually`;
  const label = `Theme: ${state}. Activate to switch to ${PREFERENCE_LABELS[nextPreference]}.`;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={label}
        aria-label={label}
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-raised hover:bg-surface-overlay',
          'border border-line hover:border-accent/40 text-content-secondary hover:text-content-primary',
          'transition-colors',
          className
        )}
      >
        <Icon className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
        {preference === 'system' && (
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-content-muted">
            Auto
          </span>
        )}
      </button>

      {/* Announced on change; the button's own name carries the same state for
          anyone who navigates back to it later. */}
      <span role="status" aria-live="polite" className="sr-only">
        {`Theme ${state}.`}
      </span>
    </>
  );
};
