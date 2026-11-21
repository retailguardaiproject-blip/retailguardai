import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun, Rows3, AlignJustify } from 'lucide-react';
import { Button } from './ui/button';

const Preferences = createContext({ compact: false });
export const useWorkspacePreferences = () => useContext(Preferences);

export function WorkspacePreferences({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('dark');
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    try {
      setTheme(localStorage.getItem('rg-theme') === 'light' ? 'light' : 'dark');
      setCompact(localStorage.getItem('rg-density') === 'compact');
    } catch { /* Storage may be disabled. */ }
  }, []);
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);
  const updateTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('rg-theme', next); } catch { /* Keep session preference. */ }
  };
  const updateDensity = () => {
    setCompact(!compact);
    try { localStorage.setItem('rg-density', compact ? 'comfortable' : 'compact'); } catch { /* Keep session preference. */ }
  };
  return <Preferences.Provider value={{ compact }}>
    <div className={compact ? 'workspace-compact' : 'workspace-comfortable'}>
      {children}
      <div className="fixed bottom-4 right-4 z-[600] flex gap-1 rounded-md border border-border bg-popover p-1 shadow-sm">
        <Button variant="ghost" size="icon" title={theme === 'dark' ? 'Light theme' : 'Dark theme'} aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'} onClick={updateTheme}>{theme === 'dark' ? <Sun /> : <Moon />}</Button>
        <Button variant="ghost" size="icon" aria-label="Compact tables" title={compact ? 'Comfortable tables' : 'Compact tables'} aria-pressed={compact} onClick={updateDensity}>{compact ? <Rows3 /> : <AlignJustify />}</Button>
      </div>
    </div>
  </Preferences.Provider>;
}