import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpenText,
  Files,
  Download,
  GraduationCap,
  Gamepad2,
  Home,
  ShieldCheck,
  Moon,
  RefreshCw,
  Settings,
  Sun,
} from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '../lib/ToastContext';

const APP_RELEASE = 'v18 - package-lock متوافق مع npm 10';

const navItems = [
  { to: '/home', label: 'الرئيسية', icon: Home },
  { to: '/library', label: 'المكتبة', icon: BookOpenText },
  { to: '/models', label: 'النماذج', icon: Files },
  { to: '/train', label: 'التدريب', icon: GraduationCap },
  { to: '/phrases', label: 'لعبة المعنى', icon: Gamepad2 },
  { to: '/progress', label: 'التقدم', icon: BarChart3 },
  { to: '/sources', label: 'المصادر', icon: ShieldCheck },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.themePreference = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#14081f' : '#2e1065');
}

export function Layout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('nt2-theme') as Theme | null) ?? 'system');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { showToast } = useToast();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // Registration succeeds silently; the UI only appears when an update exists.
    },
    onRegisterError(error) {
      console.warn('PWA registration failed', error);
    },
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('nt2-theme', theme);
    const media = matchMedia('(prefers-color-scheme: dark)');
    const listener = () => theme === 'system' && applyTheme(theme);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const themeIcon = useMemo(() => (theme === 'dark' ? Sun : Moon), [theme]);
  const ThemeIcon = themeIcon;

  const cycleTheme = () => {
    setTheme((current) => (current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system'));
  };

  const install = async () => {
    if (!installPrompt) {
      showToast('يظهر زر التثبيت بعد نشر الموقع عبر HTTPS وفي متصفح يدعم PWA.', 'info');
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') showToast('تم تثبيت التطبيق.', 'success');
    setInstallPrompt(null);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">انتقل إلى المحتوى</a>
      <header className="topbar">
        <div className="shell topbar__inner">
          <NavLink to="/home" className="brand" aria-label="NT2 Lezen B1">
            <span className="brand__mark">NT2</span>
            <span className="brand__copy">
              <strong>Lezen B1</strong>
              <small>Official Exams 2023–2025</small>
            </span>
          </NavLink>

          <nav className="main-nav" aria-label="التنقل الرئيسي">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="topbar__actions">
            <button className="icon-button" type="button" onClick={install} title="تثبيت التطبيق">
              <Download size={19} aria-hidden="true" />
              <span>تثبيت</span>
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={cycleTheme}
              title={`المظهر الحالي: ${theme}`}
            >
              <ThemeIcon size={19} aria-hidden="true" />
              <span>المظهر</span>
            </button>
          </div>
        </div>
      </header>

      {needRefresh && (
        <div className="update-banner" role="status">
          <div className="shell update-banner__inner">
            <span>يتوفر إصدار أحدث من الموقع.</span>
            <div>
              <button className="button button--light" onClick={() => void updateServiceWorker(true)}>
                <RefreshCw size={16} aria-hidden="true" /> تحديث الآن
              </button>
              <button className="button button--ghost-light" onClick={() => setNeedRefresh(false)}>
                لاحقًا
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="main-content">{children}</main>

      <footer className="footer">
        <div className="shell footer__inner">
          <div>
            <strong>NT2 Lezen B1 · Parafrase Lab</strong>
            <p>أداة تدريب غير رسمية مخصصة لنماذج Lezen I للأعوام 2023 و2024 و2025.</p>
            <p className="release-note">{APP_RELEASE}</p>
          </div>
          <p className="local-note">يُحفظ تقدمك محليًا في هذا المتصفح، ويمكن تصديره من الإعدادات.</p>
        </div>
      </footer>
    </div>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}
