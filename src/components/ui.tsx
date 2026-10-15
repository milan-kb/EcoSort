import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Check, CircleAlert, Leaf, LoaderCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/context';
import type { Status } from '../types/domain';

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="EcoSort home">
      <span className="brand-mark">
        <Leaf size={23} strokeWidth={1.8} />
      </span>
      <span>
        Eco<span className="brand-light">Sort</span>
        <small>SMALL ACTIONS. SHARED IMPACT.</small>
      </span>
    </Link>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge status-${status.toLowerCase().replace(' ', '-')}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" />
      <p>Loading your workspace…</p>
    </div>
  );
}
export function Empty({
  title = 'Nothing here yet',
  description = 'New requests will appear here.',
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Leaf size={32} />
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}
export function Notice() {
  const { notice } = useApp();
  return notice ? (
    <div
      role={notice.error ? 'alert' : 'status'}
      className={`toast ${notice.error ? 'toast-error' : ''}`}
    >
      {notice.error ? <CircleAlert size={20} /> : <Check size={20} />}
      <span>{notice.text}</span>
    </div>
  ) : null;
}
export function ErrorMessage({ message }: { message?: string }) {
  return message ? (
    <p className="field-error" role="alert">
      {message}
    </p>
  ) : null;
}
export function ConfirmDialog({
  title,
  children,
  trigger,
  onConfirm,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  title: string;
  children: ReactNode;
  trigger: ReactNode;
  onConfirm: () => Promise<void>;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <>
      <button
        type="button"
        className={danger ? 'btn btn-danger' : 'btn btn-secondary'}
        onClick={() => {
          setError('');
          ref.current?.showModal();
        }}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="dialog"
        aria-label={title}
        onCancel={(e) => {
          if (pending.current) e.preventDefault();
        }}
      >
        <div className="section-heading">
          <h2>{title}</h2>
          <button
            aria-label="Close dialog"
            className="icon-button"
            onClick={() => ref.current?.close()}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </div>
        {children}
        <ErrorMessage message={error} />
        <div className="dialog-actions">
          <button
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => ref.current?.close()}
          >
            Go back
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            disabled={busy}
            onClick={async () => {
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              try {
                await onConfirm();
                ref.current?.close();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Action failed');
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
          >
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
export function ImageUpload({
  file,
  onChange,
  label = 'Photo (optional)',
}: {
  file?: File;
  onChange: (file?: File) => void;
  label?: string;
}) {
  const [preview, setPreview] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) {
      if (input.current) input.current.value = '';
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="field">
      <label htmlFor="photo">{label}</label>
      <input
        ref={input}
        id="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      <small className="muted">
        JPEG, PNG or WebP · Up to 2 MB. Avoid photographing people or identifying documents.
      </small>
      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Selected upload preview" />
          <button type="button" className="btn btn-secondary" onClick={() => onChange(undefined)}>
            Remove photo
          </button>
        </div>
      )}
    </div>
  );
}
export function PrivateImage({ path, alt }: { path: string | null; alt: string }) {
  const { repository, actor } = useApp();
  const [url, setUrl] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    setUrl('');
    setError('');
    if (path && repository)
      void repository
        .imageUrl(path)
        .then((u) => {
          if (alive) setUrl(u);
        })
        .catch(() => {
          if (alive) setError('Image unavailable or access expired. Reopen the details to retry.');
        });
    return () => {
      alive = false;
    };
  }, [path, repository, actor?.id]);
  if (!path) return null;
  return error ? (
    <p role="alert">{error}</p>
  ) : url ? (
    <img className="evidence-image" src={url} alt={alt} />
  ) : (
    <p role="status">Loading photo…</p>
  );
}
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}
