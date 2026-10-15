import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Map,
  Plus,
  RotateCcw,
  Truck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { homeFor, useApp } from '../app/context';
import { Brand, ConfirmDialog, Notice } from './ui';

export function Layout() {
  const app = useApp(),
    navigate = useNavigate(),
    actor = app.actor!;
  const links =
    actor.role === 'resident'
      ? [
          { to: '/resident', label: 'Overview', icon: Home },
          { to: '/resident/pickup', label: 'Request pickup', icon: Plus },
          { to: '/resident/requests', label: 'My requests', icon: ClipboardList },
          { to: '/resident/guide', label: 'Segregation guide', icon: BookOpen },
        ]
      : actor.role === 'collector'
        ? [
            { to: '/collector', label: 'Assigned tasks', icon: Truck },
            { to: '/profile', label: 'My profile', icon: UserRound },
          ]
        : [
            { to: '/admin', label: 'Overview', icon: LayoutDashboard },
            { to: '/admin/requests', label: 'All requests', icon: ClipboardList },
            { to: '/admin/assignments', label: 'Assignments', icon: UsersRound },
            { to: '/admin/map', label: 'Waste map', icon: Map },
            { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
          ];
  return (
    <div className={`workspace role-${actor.role}`}>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-label">
          {actor.role === 'admin'
            ? 'PANCHAYAT WORKSPACE'
            : actor.role === 'collector'
              ? 'COLLECTOR WORKSPACE'
              : 'YOUR NEIGHBOURHOOD'}
        </div>
        <nav aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink end={to === homeFor(actor.role)} key={to} to={to}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <LeafGraphic />
            <p>
              A cleaner community
              <br />
              starts with us.
            </p>
            <small>Responsibility in every pickup.</small>
          </div>
          <NavLink to="/about">
            <Info size={18} />
            About EcoSort
          </NavLink>
          <NavLink to="/profile">
            <UserRound size={18} />
            Profile
          </NavLink>
          <button
            onClick={async () => {
              await app.logout();
              navigate('/');
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="location-label">
            <span className="live-dot" />
            Vellangallur, Kerala
            <span className="topbar-divider" />
            Community waste coordination
          </div>
          <NavLink to="/profile" className="user-chip" aria-label="My profile">
            <span className="avatar">
              {actor.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              {actor.name}
              <small>
                {actor.role === 'admin'
                  ? 'Panchayat administrator'
                  : actor.role === 'collector'
                    ? 'Collection partner'
                    : actor.ward}
              </small>
            </span>
          </NavLink>
        </header>
        {app.demo && (
          <div className="demo-banner">
            <span>
              <strong>DEMO MODE</strong>
              <span className="demo-description">Fictional data · Saved in this browser</span>
            </span>
            <div className="demo-controls">
              <label className="sr-only" htmlFor="demo-role">
                Demo role
              </label>
              <select
                id="demo-role"
                aria-label="Demo role"
                value={actor.id}
                onChange={(e) => {
                  app.switchDemo(e.target.value);
                  navigate(homeFor(app.demoProfiles.find((p) => p.id === e.target.value)!.role));
                }}
              >
                {app.demoProfiles.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.role === 'admin'
                      ? 'Administrator'
                      : p.role === 'resident'
                        ? 'Resident'
                        : `Collector · ${p.name}`}
                  </option>
                ))}
              </select>
              <ConfirmDialog
                title="Reset demo data?"
                trigger={
                  <>
                    <RotateCcw size={14} />
                    <span>Reset demo</span>
                  </>
                }
                onConfirm={app.reset}
                confirmLabel="Reset demo"
              >
                <p>
                  All local demo requests, assignments and photographs will be replaced with
                  fictional examples. This cannot be undone.
                </p>
              </ConfirmDialog>
            </div>
          </div>
        )}
        <main id="main-content" tabIndex={-1} className="main-content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>EcoSort · Human values, everyday action.</span>
          <span>Collection needs real people and authorized destinations.</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink end={to === homeFor(actor.role)} key={to} to={to}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <Notice />
    </div>
  );
}
function LeafGraphic() {
  return (
    <svg width="42" height="40" viewBox="0 0 42 40" aria-hidden="true">
      <path
        d="M8 32C3 15 17 5 37 5c0 20-14 29-27 23m-3 8L29 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
