import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu, PlusSquare, RotateCcw, Trophy, User, X } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useAppSelectors';
import { useAppStore } from '@/store/appStore';

export default function Layout() {
  const user = useCurrentUser();
  const logout = useAppStore((state) => state.logout);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-white' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-[#07090F] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_30%),linear-gradient(180deg,#07090F,#0B1020)]" />
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#07090F]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <Trophy className="h-6 w-6 text-blue-400" />
            Nexx Tournaments
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/" className={navLinkClass}>
              Главная
            </NavLink>
            <NavLink to="/tournaments" className={navLinkClass}>
              Турниры
            </NavLink>
            <NavLink to="/rankings" className={navLinkClass}>
              Рейтинг
            </NavLink>
            {user?.role === 'organizer' && (
              <NavLink to="/organizer/tournaments" className={navLinkClass}>
                Мои турниры
              </NavLink>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user?.role === 'organizer' && (
              <Link to="/organizer/tournaments/new">
                <Button className="px-3 py-2 text-xs">
                  <PlusSquare className="h-4 w-4" />
                  Создать турнир
                </Button>
              </Link>
            )}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  <User className="h-4 w-4" />
                  {user.login}
                </Link>
                <button
                  onClick={() => {
                    void logout();
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button className="text-slate-300 md:hidden" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="flex flex-col gap-4 border-t border-slate-800 px-4 py-4 md:hidden">
            <NavLink to="/" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Главная
            </NavLink>
            <NavLink to="/tournaments" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Турниры
            </NavLink>
            <NavLink to="/rankings" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Рейтинг
            </NavLink>
            {user?.role === 'organizer' && (
              <NavLink to="/organizer/tournaments" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Мои турниры
              </NavLink>
            )}
            {user ? (
              <>
                <Link to="/profile" className="text-sm font-medium text-slate-300" onClick={() => setMenuOpen(false)}>
                  Профиль
                </Link>
                <button
                  onClick={() => {
                    void logout();
                    setMenuOpen(false);
                  }}
                  className="text-sm font-medium text-slate-400 text-left"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300" onClick={() => setMenuOpen(false)}>
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-blue-500 px-4 py-2 text-center text-sm font-semibold text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <motion.main
        className="flex-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.main>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Nexx Tournaments MVP.</p>
          <div className="flex items-center gap-3">
            <button onClick={() => void resetDemo()} className="inline-flex items-center gap-1 transition hover:text-white">
              <RotateCcw className="h-4 w-4" />
              Сбросить демо
            </button>
            <p>Каркас сначала, polish потом.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
