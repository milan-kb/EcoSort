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
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { homeFor, useApp } from '../../app/context';
import { Brand, ErrorMessage, Loading, Notice } from '../../components/ui';
import { profileSchema, wards } from '../../lib/domain';
import { supabase } from '../../services/supabase';

export function PublicHeader() {
  return (
    <header className="public-header">
      <Brand />
      <nav aria-label="Public navigation">
        <Link to="/about">Our purpose</Link>
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
  function enter(id: string) {
    app.switchDemo(id);
    navigate(homeFor(app.demoProfiles.find((p) => p.id === id)!.role));
  }
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
                },
                {
                  role: 'collector',
                  icon: Truck,
                  title: 'As a collector',
                  text: 'Find assigned jobs and record physical collection.',
                },
                {
                  role: 'admin',
                  icon: ClipboardList,
                  title: 'As an administrator',
                  text: 'Coordinate people, review requests and see the bigger picture.',
                },
              ].map(({ role, icon: Icon, title, text }) => (
                <button
                  key={role}
                  className="entry-card"
                  onClick={() => enter(app.demoProfiles.find((p) => p.role === role)!.id)}
                >
                  <Icon size={25} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span>
                    Enter workspace <ArrowRight size={17} />
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
export function AuthPage({ signup = false }: { signup?: boolean }) {
  const app = useApp(),
    navigate = useNavigate(),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false);
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
  if (app.actor) return <Navigate to={homeFor(app.actor.role)} replace />;
  if (app.loading) return <Loading />;
  const submit = handleSubmit(async (values) => {
    setError('');
    try {
      if (!supabase)
        throw new Error(
          app.error ||
            'Connected authentication is unavailable in demo mode. Use instant demo entry.',
        );
      const result = signup
        ? await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: { data: { name: values.name, phone: values.phone, ward: values.ward } },
          })
        : await supabase.auth.signInWithPassword({
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
          <h2>
            {signup
              ? 'Create your resident account'
              : app.demo
                ? 'Choose a demo workspace'
                : 'Sign in to your workspace'}
          </h2>
          <p className="muted">
            {app.demo
              ? 'No credentials needed. The whole workflow runs locally.'
              : signup
                ? 'Only resident accounts can be created here.'
                : 'Use your email and password. Privileged accounts are provisioned separately.'}
          </p>
          {app.demo ? (
            <>
              <div className="demo-role-list">
                {app.demoProfiles.map((p) => (
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
              </div>
              <div className="info-note">
                Fictional examples only. Demo role switching never grants access to a connected
                Supabase project.
              </div>
            </>
          ) : success ? (
            <div role="status" className="info-note">
              Check your email to confirm your account, then return to sign in. No OTP
              authentication is implemented.
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {signup && (
                <>
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
                </>
              )}
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
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  {...register('password')}
                />
                <ErrorMessage message={errors.password?.message} />
              </div>
              <ErrorMessage message={error || app.error || undefined} />
              <button className="btn btn-primary full-width" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : signup ? 'Create resident account' : 'Sign in'}
                <ArrowRight size={18} />
              </button>
              <p className="small muted">
                {signup ? 'Already have an account?' : 'New to EcoSort?'}{' '}
                <Link to={signup ? '/signin' : '/signup'}>
                  {signup ? 'Sign in' : 'Create a resident account'}
                </Link>
              </p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
