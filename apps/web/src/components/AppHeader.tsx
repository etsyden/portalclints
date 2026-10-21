import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from 'lucide-react';

import {
  getMe,
  getStoredUser,
  logout,
  type AuthUser,
} from '../api/auth';

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const profile = await getMe();
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) setUser(getStoredUser());
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const fullName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : '';

  const userName = fullName || 'Пользователь';
  const initial = user?.firstName?.trim()?.charAt(0)?.toUpperCase() || 'П';

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } catch {
      // logout очищает локальную авторизацию даже при ошибке запроса.
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-5 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="text-left text-lg font-semibold tracking-tight text-slate-900"
        >
          Рабочее пространство
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Уведомления"
            title="Уведомления"
            onClick={() => navigate('/notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell size={19} strokeWidth={1.8} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 sm:gap-3 sm:px-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl.startsWith("http") ? user.avatarUrl : `http://localhost:3000${user.avatarUrl}`}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <div className="hidden max-w-48 text-left sm:block">
                <div className="truncate text-sm font-medium text-slate-800">
                  {userName}
                </div>
                <div className="text-xs text-slate-500">
                  Мой аккаунт
                </div>
              </div>

              <ChevronDown
                size={16}
                className={[
                  'text-slate-400 transition-transform',
                  menuOpen ? 'rotate-180' : '',
                ].join(' ')}
              />
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Закрыть меню пользователя"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />

                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {userName}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {user?.email || ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigate('/profile')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <UserRound size={17} />
                    Мой профиль
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigate('/settings')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <Settings size={17} />
                    Настройки
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    role="menuitem"
                    disabled={loggingOut}
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut size={17} />
                    {loggingOut ? 'Выходим...' : 'Выйти'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

