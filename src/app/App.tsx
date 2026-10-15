import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './context';
import { Layout } from '../components/Layout';
import { ConfirmDialog, ErrorMessage, Loading } from '../components/ui';
import { AuthPage, Landing } from '../features/auth/Public';
import { ResidentHome, MyRequests } from '../features/resident/Home';
import { RequestForm } from '../features/resident/RequestForm';
import { Guide } from '../features/segregation/Guide';
import { RequestDetails } from '../features/RequestDetails';
import { Confirmation } from '../features/collector/Confirmation';
import { Tasks } from '../features/collector/Tasks';
import { AboutContent, NotFound, Profile, PublicAbout } from '../features/Shared';
import { AccountLinks } from '../components/AccountLinks';
import type { Role } from '../types/domain';

const Dashboard = lazy(() =>
  import('../features/admin/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const AllRequests = lazy(() =>
  import('../features/admin/Dashboard').then((m) => ({ default: m.AllRequests })),
);
const MapPage = lazy(() =>
  import('../features/admin/Dashboard').then((m) => ({ default: m.MapPage })),
);
const Analytics = lazy(() =>
  import('../features/admin/Analytics').then((m) => ({ default: m.Analytics })),
);

function Guard({ role }: { role?: Role }) {
  const { actor, loading, error, refresh, logout, demo, reset } = useApp();
  if (loading) return <Loading />;
  if (!actor) return <Navigate to="/signin" replace />;
  if (role && actor.role !== role)
    return (
      <section className="access-denied" role="alert">
        <h1>Access restricted</h1>
        <p>This workspace requires an authorized {role} account.</p>
        <a className="btn btn-primary" href={`/${actor.role}`}>
          Return to your workspace
        </a>
      </section>
    );
  if (error)
    return (
      <section className="access-denied">
        <h1>Could not load your workspace</h1>
        <ErrorMessage message={error} />
        <button className="btn btn-primary" onClick={() => void refresh()}>
          Try again
        </button>
        {demo && (
          <ConfirmDialog
            title="Restore fictional demo data?"
            trigger="Reset demo"
            onConfirm={reset}
            confirmLabel="Reset demo"
          >
            <p>
              This replaces all local demo changes, including unreadable data, with fictional
              examples.
            </p>
          </ConfirmDialog>
        )}
        <button className="btn btn-secondary" onClick={() => void logout()}>
          Sign out
        </button>
      </section>
    );
  return <Outlet />;
}

export default function App() {
  const location = useLocation(),
    { actor } = useApp();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'EcoSort — Community waste coordination';
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<AuthPage key="signin" />} />
          <Route path="/signup" element={<AuthPage key="signup" signup />} />
          <Route element={<Guard />}>
            <Route element={<Layout />}>
              <Route element={<Guard role="resident" />}>
                <Route path="/resident" element={<ResidentHome />} />
                <Route path="/resident/pickup" element={<RequestForm key="pickup" />} />
                <Route path="/resident/dumping" element={<RequestForm key="dumping" dumping />} />
                <Route path="/resident/guide" element={<Guide />} />
                <Route path="/resident/requests" element={<MyRequests />} />
                <Route path="/resident/requests/:id" element={<RequestDetails />} />
              </Route>
              <Route element={<Guard role="collector" />}>
                <Route path="/collector" element={<Tasks />} />
                <Route path="/collector/requests/:id" element={<RequestDetails />} />
                <Route path="/collector/requests/:id/confirm" element={<Confirmation />} />
              </Route>
              <Route element={<Guard role="admin" />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/requests" element={<AllRequests />} />
                <Route path="/admin/requests/:id" element={<RequestDetails />} />
                <Route path="/admin/assignments" element={<AllRequests assignments />} />
                <Route path="/admin/map" element={<MapPage />} />
                <Route path="/admin/analytics" element={<Analytics />} />
              </Route>
              <Route
                path="/profile"
                element={
                  <>
                    <Profile key={actor?.id} />
                    <AccountLinks />
                  </>
                }
              />
              {actor && <Route path="/about" element={<AboutContent />} />}
            </Route>
          </Route>
          {!actor && <Route path="/about" element={<PublicAbout />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
