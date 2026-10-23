import {
  ArrowRight,
  Check,
  CheckCheck,
  ClipboardList,
  Leaf,
  MapPin,
  ShieldCheck,
  Truck,
  UsersRound,
} from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { homeFor, useApp } from '../../app/context';
import { Brand, ErrorMessage, Loading, Notice } from '../../components/ui';
import { profileSchema, wards } from '../../lib/domain';
import { supabase } from '../../services/supabase';
import type { Role } from '../../types/domain';

export function PublicHeader() {
  return (
    <header className="public-header">
      <Brand />
      <nav aria-label="Public navigation">
        <Link to="/about">Our purpose</Link>
        <Link to="/resident/login">Resident</Link>
        <Link to="/collector/login">Collector</Link>
        <Link to="/admin/login">Panchayat</Link>
        <Link className="btn btn-secondary" to="/signin">
          Sign in <ArrowRight size={16} />
        </Link>
      </nav>
    </header>
  );
}
export function Landing() {
  const app = useApp(),
    navigate = useNavigate();
  return (
    <div className="public-page">
      <PublicHeader />
      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-dot" />
              BETTER HABITS. CLEANER NEIGHBOURHOODS.
            </p>
            <h1>
              Less waste in the open.
              <br />
              <span>More care in every action.</span>
            </h1>
            <p className="hero-description">
              Segregate at home. Request a pickup. Follow it through.
              <br className="desktop-only" /> A simple way to care for our shared spaces, together.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to={app.demo ? '/signin' : '/signup'}>
                {app.demo ? 'Explore the live demo' : 'Join as a resident'}
                <ArrowRight size={18} />
              </Link>
              <Link className="text-link" to="/about">
                Why EcoSort <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-footnote">
              <ShieldCheck size={18} />
              <span>A UHV student project · No municipal service claims</span>
            </div>
          </div>
          <div className="hero-workflow">
            <div className="workflow-head">
              <span className="eyebrow">THE ECOSORT WAY</span>
              <span className="badge status-collected">
                <Leaf size={13} />
                Built around people
              </span>
            </div>
            <div className="workflow-item">
              <span className="workflow-number">01</span>
              <span className="workflow-icon">
                <Leaf />
              </span>
              <div>
                <h2>Separate with care</h2>
                <p>Good collection starts at home.</p>
              </div>
              <Check size={17} />
            </div>
            <div className="workflow-item">
              <span className="workflow-number">02</span>
              <span className="workflow-icon">
                <Truck />
              </span>
              <div>
                <h2>Coordinate a pickup</h2>
                <p>Residents, collectors, administrators.</p>
              </div>
              <Check size={17} />
            </div>
            <div className="workflow-item">
              <span className="workflow-number">03</span>
              <span className="workflow-icon">
                <CheckCheck />
              </span>
              <div>
                <h2>Close the loop</h2>
                <p>Record collection and destination.</p>
              </div>
              <Check size={17} />
            </div>
            <div className="workflow-caption">
              <span className="live-dot" />
              Technology supports action. People make it happen.
            </div>
          </div>
        </section>
        <section className="landing-principles">
          <div>
            <UsersRound />
            <h2>
              One community.
              <br />A shared responsibility.
            </h2>
          </div>
          <p>
            EcoSort responds to an assigned college scenario about unsegregated waste and open
            dumping in Vellangallur. It connects the steps that are often missing — without
            pretending software can replace a real collection system.
          </p>
        </section>
        {app.demo && (
          <section className="demo-entry">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TRY EVERY SIDE OF THE STORY</p>
                <h2>Your classroom-ready workspace</h2>
              </div>
              <span className="badge">Offline-ready demo</span>
            </div>
            <div className="three-grid">
              {[
                {
                  role: 'resident',
                  icon: Leaf,
                  title: 'As a resident',
                  text: 'Separate waste, request collection and track progress.',
                  path: '/resident/login',
                },
                {
                  role: 'collector',
                  icon: Truck,
                  title: 'As a collector',
                  text: 'Find assigned jobs and record physical collection.',
                  path: '/collector/login',
                },
                {
                  role: 'admin',
                  icon: ClipboardList,
                  title: 'As an administrator',
                  text: 'Coordinate people, review requests and see the bigger picture.',
                  path: '/admin/login',
                },
              ].map(({ role, icon: Icon, title, text, path }) => (
                <button key={role} className="entry-card" onClick={() => navigate(path)}>
                  <Icon size={25} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span>
                    {role === 'resident'
                      ? 'Resident Login'
                      : role === 'collector'
                        ? 'Collector Login'
                        : 'Panchayat Login'}{' '}
                    <ArrowRight size={17} />
                  </span>
                </button>
              ))}
            </div>
            <p className="muted small">
              All people, addresses and location pins in demo mode are synthetic. Changes stay in
              this browser.
            </p>
          </section>
        )}
      </main>
      <footer className="public-footer">
        <Brand />
        <span>Responsibility · Cooperation · Participation · Harmony with nature</span>
        <span>UHV · Waste Management, Group 2</span>
      </footer>
      <Notice />
    </div>
  );
}
const authSchema = profileSchema.extend({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});
type AuthValues = z.infer<typeof authSchema>;
export function AuthPage({
  signup = false,
  defaultRole,
}: {
  signup?: boolean;
  defaultRole?: Role;
}) {
  const app = useApp(),
    navigate = useNavigate(),
    location = useLocation(),
    params = useParams<{ roleParam?: string }>(),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false);

  const pathname = location.pathname.toLowerCase();
  let detectedRole: Role = defaultRole || 'resident';
  if (
    params.roleParam === 'admin' ||
    params.roleParam === 'panchayat' ||
    pathname.includes('/admin') ||
    pathname.includes('/panchayat')
  ) {
    detectedRole = 'admin';
  } else if (params.roleParam === 'collector' || pathname.includes('/collector')) {
    detectedRole = 'collector';
  } else if (params.roleParam === 'resident' || pathname.includes('/resident')) {
    detectedRole = 'resident';
  }
  const activeRole: Role = detectedRole;

  const isRoleSpecific = Boolean(
    defaultRole ||
    params.roleParam ||
    pathname.includes('/resident') ||
    pathname.includes('/collector') ||
    pathname.includes('/admin') ||
    pathname.includes('/panchayat') ||
    pathname.startsWith('/signin/') ||
    pathname.startsWith('/login/'),
  );

  const roleConfig = {
    resident: {
      badge: 'RESIDENT PORTAL',
      title: 'Resident Sign In',
      subtitle:
        'Household waste coordination. Request collections, report open dumping, and track pickup journeys in your neighbourhood.',
      icon: Leaf,
      emailPlaceholder: 'resident@example.test',
      emailLabel: 'Resident email',
      buttonText: 'Sign in as Resident',
    },
    collector: {
      badge: 'COLLECTOR PORTAL',
      title: 'Collection Partner Sign In',
      subtitle:
        'Field operations portal. Review assigned tasks, confirm physical collections, and record verified destinations.',
      icon: Truck,
      emailPlaceholder: 'collector@ecosort.test',
      emailLabel: 'Collector email',
      buttonText: 'Sign in as Collector',
    },
    admin: {
      badge: 'PANCHAYAT WORKSPACE',
      title: 'Panchayat Administrator Sign In',
      subtitle:
        'Official municipal administration portal. Coordinate requests, review community submissions, and monitor waste analytics.',
      icon: ClipboardList,
      emailPlaceholder: 'admin@panchayat.gov.test',
      emailLabel: 'Administrator email',
      buttonText: 'Sign in as Administrator',
    },
  }[activeRole];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(
      signup
        ? authSchema
        : authSchema.extend({ name: z.string(), phone: z.string(), ward: z.string() }),
    ),
    defaultValues: { name: '', phone: '', ward: '' },
  });

  // Only redirect away on generic unadorned "/signin" or "/login" when user did not request a role login page
  const isGenericLogin = pathname === '/signin' || pathname === '/login';
  if (app.actor && isGenericLogin) return <Navigate to={homeFor(app.actor.role)} replace />;
  if (app.loading) return <Loading />;

  const submit = handleSubmit(async (values) => {
    setError('');
    try {
      const client = supabase;
      if (!client) {
        if (signup) {
          const res = app.demoProfiles.find((p) => p.role === 'resident') || app.demoProfiles[0];
          if (res) {
            app.switchDemo(res.id);
            navigate(homeFor('resident'));
            return;
          }
        } else {
          // Seamless demo login: match active role
          const target = app.demoProfiles.find((p) => p.role === activeRole) || app.demoProfiles[0];
          if (target) {
            app.switchDemo(target.id);
            navigate(homeFor(target.role));
            return;
          }
        }
        return;
      }
      const result = signup
        ? await client.auth.signUp({
            email: values.email,
            password: values.password,
            options: { data: { name: values.name, phone: values.phone, ward: values.ward } },
          })
        : await client.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          });
      if (result.error) throw result.error;
      if (signup && !result.data.session) setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    }
  });

  return (
    <div className="public-page">
      <PublicHeader />
      <main id="main-content" className="auth-wrap">
        <div className="auth-intro">
          <p className="eyebrow">WELCOME TO ECOSORT</p>
          <h1>{signup ? 'A small step toward a cleaner community.' : 'Good to have you here.'}</h1>
          <p>
            Responsible habits. Coordinated collection.
            <br />A little more care for the place we call home.
          </p>
          <MapPin />
          <small>Vellangallur · Kerala · UHV student project</small>
        </div>

        <section className="card auth-card">
          {signup ? (
            <>
              <h2>Create your resident account</h2>
              <p className="muted">Only resident accounts can be created here.</p>
              {success ? (
                <div role="status" className="info-note">
                  Check your email to confirm your account, then return to sign in. No OTP
                  authentication is implemented.
                </div>
              ) : (
                <form onSubmit={submit} noValidate aria-label="Resident registration form">
                  {(['name', 'phone'] as const).map((field) => (
                    <div className="field" key={field}>
                      <label htmlFor={field}>
                        {field === 'name' ? 'Full name' : 'Phone number'}
                      </label>
                      <input
                        id={field}
                        autoComplete={field === 'name' ? 'name' : 'tel'}
                        {...register(field)}
                      />
                      <ErrorMessage message={errors[field]?.message} />
                    </div>
                  ))}
                  <div className="field">
                    <label htmlFor="ward">Ward</label>
                    <select id="ward" {...register('ward')}>
                      <option value="">Choose a ward</option>
                      {wards.map((w) => (
                        <option key={w}>{w}</option>
                      ))}
                    </select>
                    <ErrorMessage message={errors.ward?.message} />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" autoComplete="email" {...register('email')} />
                    <ErrorMessage message={errors.email?.message} />
                  </div>
                  <div className="field">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      {...register('password')}
                    />
                    <ErrorMessage message={errors.password?.message} />
                  </div>
                  <ErrorMessage message={error || app.error || undefined} />
                  <button className="btn btn-primary full-width" disabled={isSubmitting}>
                    {isSubmitting ? 'Please wait…' : 'Create resident account'}
                    <ArrowRight size={18} />
                  </button>
                  <p className="small muted">
                    Already have an account? <Link to="/signin">Sign in</Link>
                  </p>
                </form>
              )}
            </>
          ) : (
            <>
              {/* Role Navigation Tabs */}
              <nav className="auth-role-tabs" aria-label="Role login portals">
                <Link
                  to="/resident/login"
                  className={`auth-role-tab ${activeRole === 'resident' ? 'active' : ''}`}
                  aria-current={activeRole === 'resident' ? 'page' : undefined}
                >
                  <Leaf size={16} />
                  <span>Resident</span>
                </Link>
                <Link
                  to="/collector/login"
                  className={`auth-role-tab ${activeRole === 'collector' ? 'active' : ''}`}
                  aria-current={activeRole === 'collector' ? 'page' : undefined}
                >
                  <Truck size={16} />
                  <span>Collector</span>
                </Link>
                <Link
                  to="/admin/login"
                  className={`auth-role-tab ${activeRole === 'admin' ? 'active' : ''}`}
                  aria-current={activeRole === 'admin' ? 'page' : undefined}
                >
                  <ClipboardList size={16} />
                  <span>Panchayat</span>
                </Link>
              </nav>

              {app.actor && (
                <div className="info-note small" style={{ marginBottom: '16px' }}>
                  Currently active as <strong>{app.actor.name}</strong> (
                  {app.actor.role === 'admin' ? 'Panchayat Administrator' : app.actor.role}). You
                  can sign in below to switch accounts.
                </div>
              )}

              {/* Role Card Header */}
              <div className="auth-card-header">
                <div className="role-icon">
                  <roleConfig.icon size={22} />
                </div>
                <div>
                  <span className="badge">{roleConfig.badge}</span>
                  <h2>{roleConfig.title}</h2>
                </div>
              </div>

              <p className="muted">{roleConfig.subtitle}</p>

              {/* Authentication Form */}
              <form onSubmit={submit} noValidate aria-label={`${roleConfig.title} form`}>
                <div className="field">
                  <label htmlFor="email">{roleConfig.emailLabel}</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={roleConfig.emailPlaceholder}
                    {...register('email')}
                  />
                  <ErrorMessage message={errors.email?.message} />
                </div>
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter account password"
                    {...register('password')}
                  />
                  <ErrorMessage message={errors.password?.message} />
                </div>
                <ErrorMessage message={error || undefined} />

                <button className="btn btn-primary full-width" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait…' : roleConfig.buttonText}
                  <ArrowRight size={18} />
                </button>

                {activeRole === 'resident' ? (
                  <p className="small muted">
                    New to EcoSort? <Link to="/signup">Create a resident account</Link>
                  </p>
                ) : activeRole === 'collector' ? (
                  <div className="info-note small" style={{ marginTop: '16px' }}>
                    Collector accounts are provisioned and assigned by the Panchayat Administration.
                  </div>
                ) : (
                  <div className="info-note small" style={{ marginTop: '16px' }}>
                    Official access only. Administrative credentials require municipal
                    authorization.
                  </div>
                )}
              </form>

              {/* Instant Demo Entry Section */}
              {app.demo && (
                <div className="demo-quick-section">
                  <div className="demo-section-heading">
                    <h4>Demo Mode · Instant Access</h4>
                    <span className="badge">No credentials needed</span>
                  </div>
                  <p className="small muted">
                    {isRoleSpecific
                      ? `Instant demo entry for ${activeRole === 'admin' ? 'Panchayat Administration' : activeRole}:`
                      : 'Choose a demo workspace to enter without signing in:'}
                  </p>
                  <div className="demo-role-list">
                    {app.demoProfiles
                      .filter((p) => (isRoleSpecific ? p.role === activeRole : true))
                      .map((p) => (
                        <button
                          key={p.id}
                          className="btn btn-secondary"
                          onClick={() => {
                            app.switchDemo(p.id);
                            navigate(homeFor(p.role));
                          }}
                        >
                          {p.role === 'admin'
                            ? 'Panchayat Administrator'
                            : p.role === 'resident'
                              ? 'Resident'
                              : `Collector · ${p.name}`}
                          <ArrowRight size={18} />
                        </button>
                      ))}

                    {isRoleSpecific && (
                      <div className="other-demo-links">
                        <small className="muted">Other demo workspaces:</small>{' '}
                        {app.demoProfiles
                          .filter((p) => p.role !== activeRole)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="text-link small"
                              onClick={() => {
                                app.switchDemo(p.id);
                                navigate(homeFor(p.role));
                              }}
                            >
                              {p.role === 'admin'
                                ? 'Panchayat Administrator'
                                : p.role === 'resident'
                                  ? 'Resident'
                                  : `Collector (${p.name.split(' ')[0]})`}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="info-note" style={{ marginTop: '12px' }}>
                    Fictional examples only. Demo role switching never grants access to a connected
                    Supabase project.
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
