import { useEffect, useState } from 'react';
import { DataProvider } from './context/DataContext';
import { useDeviceMode, type ViewMode } from './hooks/useDeviceMode';
import type { Theme } from './pages/Settings';
import { MobileApp } from './layouts/MobileApp';
import { DesktopApp } from './layouts/DesktopApp';
import { LoginScreen } from './components/LoginScreen';
import { isLoggedIn } from './lib/authConfig';
import { useDefaultsIfUnconfigured } from './lib/sheetsConfig';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('cb-theme') as Theme) || 'system');
  const [mode, setMode] = useState<ViewMode>(() => (localStorage.getItem('cb-mode') as ViewMode) || 'auto');
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const resolvedMode = useDeviceMode(mode);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('cb-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cb-mode', mode);
  }, [mode]);

  if (!loggedIn) {
    return (
      <LoginScreen
        onSuccess={() => {
          useDefaultsIfUnconfigured();
          setLoggedIn(true);
        }}
      />
    );
  }

  return (
    <DataProvider>
      {resolvedMode === 'desktop' ? (
        <DesktopApp theme={theme} onThemeChange={setTheme} mode={mode} onModeChange={setMode} />
      ) : (
        <MobileApp theme={theme} onThemeChange={setTheme} mode={mode} onModeChange={setMode} />
      )}
    </DataProvider>
  );
}
