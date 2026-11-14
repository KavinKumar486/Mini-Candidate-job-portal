import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from './ui/Button.jsx';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`;

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/jobs" className="text-lg font-bold tracking-tight text-indigo-700">
            Jobs Territory
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/jobs" className={linkClass}>
              Jobs
            </NavLink>
            {user && (
              <>
                <NavLink to="/applications" className={linkClass}>
                  Applications
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  Profile
                </NavLink>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
                <Button variant="secondary" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
