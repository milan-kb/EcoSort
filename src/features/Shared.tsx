import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, HeartHandshake, Leaf, ShieldCheck, UsersRound } from 'lucide-react';
import { useApp } from '../app/context';
import { ErrorMessage, PageTitle } from '../components/ui';
import { profileSchema, wards } from '../lib/domain';
import { PublicHeader } from './auth/Public';
import type { Profile as ProfileType } from '../types/domain';
export function Profile() {
  const app = useApp(),
    actor = app.actor!;
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Pick<ProfileType, 'name' | 'phone' | 'ward'>>({
    resolver: zodResolver(profileSchema),
    defaultValues: actor,
  });
  return (
    <>
      <PageTitle
        eyebrow="YOUR COMMUNITY IDENTITY"
        title="My profile"
        description="Your contact details support collection coordination. They are not public."
      />
      <form
        className="card profile-form"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          setError('');
          try {
            const result = await app.repository!.updateProfile(actor, values);
            app.setActor(result);
            await app.refresh();
            app.notify('Profile updated.');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save profile');
          }
        })}
      >
        <span className="badge">
          {actor.role === 'admin' ? 'Panchayat administrator' : actor.role}
        </span>
        {(['name', 'phone'] as const).map((field) => (
          <div className="field" key={field}>
            <label htmlFor={field}>{field === 'name' ? 'Full name' : 'Phone number'}</label>
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
            {[...new Set([...wards, actor.ward])].map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          <ErrorMessage message={errors.ward?.message} />
        </div>
        <ErrorMessage message={error} />
        <button className="btn btn-primary" disabled={isSubmitting}>
          <Check size={17} />
          {isSubmitting ? 'Saving…' : 'Save profile'}
        </button>
        <p className="small muted">
          Roles cannot be changed here. Privileged accounts are provisioned through the database by
          authorized project operators.
        </p>
      </form>
    </>
  );
}
export function AboutContent() {
  return (
    <>
      <PageTitle
        eyebrow="UNIVERSAL HUMAN VALUES · GROUP 2"
        title="Better systems begin with human care."
        description="EcoSort supports responsible action. It does not replace it."
      />
      <section className="card about-purpose">
        <Leaf size={32} className="forest" />
        <h2>The problem we’re responding to</h2>
        <blockquote>
          “Garbage dumped in open areas without segregation or collection systems (Vellangallur).”
        </blockquote>
        <p>
          This is our assigned UHV college scenario, not an independently verified statement about
          current municipal services. The problem is not just unreported garbage — it is a missing
          chain of household segregation, coordinated collection and accountability.
        </p>
        <div className="journey-strip">
          Segregate <span>→</span>Request <span>→</span>Assign <span>→</span>Collect <span>→</span>
          Record destination
        </div>
      </section>
      <div className="two-grid">
        {[
          {
            icon: ShieldCheck,
            title: 'Responsibility',
            text: 'Residents explicitly confirm segregation. Collectors confirm physical collection and record the next destination.',
          },
          {
            icon: HeartHandshake,
            title: 'Cooperation',
            text: 'Households, collectors and administrators see different parts of one shared workflow, with clear accountability.',
          },
          {
            icon: UsersRound,
            title: 'Participation',
            text: 'Residents can request a pickup or report an existing public dumping site. Every request has a visible journey.',
          },
          {
            icon: Leaf,
            title: 'Harmony with nature',
            text: 'Separation, safe handling and traceable destinations support care for our shared environment — without invented treatment claims.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <article className="card value-card" key={title}>
            <Icon size={26} />
            <h2>{title}</h2>
            <p className="muted">{text}</p>
          </article>
        ))}
      </div>
      <div className="info-note">
        EcoSort does not create jobs, facilities, municipal partnerships or a guaranteed collection
        service. Real workers, accepted materials and authorized disposal arrangements are
        essential. The segregation assistant is a manual educational guide; no AI inference is
        claimed.
      </div>
    </>
  );
}
export function PublicAbout() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main id="main-content" className="public-about">
        <AboutContent />
        <Link className="btn btn-primary" to="/signin">
          Explore EcoSort
        </Link>
      </main>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="not-found">
      <Leaf size={36} />
      <span className="eyebrow">404 · A SMALL DETOUR</span>
      <h1>This page isn’t here.</h1>
      <p className="muted">Let’s get you back to a familiar place.</p>
      <Link className="btn btn-primary" to="/">
        Back to EcoSort
      </Link>
    </div>
  );
}
