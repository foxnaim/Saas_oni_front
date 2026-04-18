'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeSwitchProps {
  /** Compact variant — smaller buttons for tight layouts */
  size?: 'default' | 'sm';
}

const ThemeSwitch = ({ size = 'default' }: ThemeSwitchProps) => {
  const { theme, setTheme } = useTheme();
  // Avoid hydration mismatch — render nothing until mounted
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a stable placeholder that matches the server shape
    return (
      <div
        className={
          size === 'sm'
            ? 'flex items-center gap-1'
            : 'flex items-center gap-1.5'
        }
        aria-hidden="true"
      >
        <div className={size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'} />
        <div className={size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'} />
      </div>
    );
  }

  const isLight = theme === 'light';

  const baseBtn =
    'inline-flex items-center justify-center border-0 outline-none cursor-pointer ' +
    'transition-all duration-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ' +
    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none';

  const sizeClasses =
    size === 'sm'
      ? 'h-7 w-7 text-sm'
      : 'h-9 w-9 text-base';

  const activeClasses =
    'bg-primary text-black shadow-brutal-sm';

  const inactiveClasses =
    'bg-transparent border-2 border-foreground/20 text-foreground/50 hover:border-foreground/50 hover:text-foreground';

  return (
    <div
      className={size === 'sm' ? 'flex items-center gap-1' : 'flex items-center gap-1.5'}
      role="group"
      aria-label="Theme selector"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`${baseBtn} ${sizeClasses} ${isLight ? activeClasses : inactiveClasses}`}
        aria-label="Switch to light theme"
        aria-pressed={isLight}
      >
        ☀️
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`${baseBtn} ${sizeClasses} ${!isLight ? activeClasses : inactiveClasses}`}
        aria-label="Switch to dark theme"
        aria-pressed={!isLight}
      >
        🌙
      </button>
    </div>
  );
};

export default ThemeSwitch;
