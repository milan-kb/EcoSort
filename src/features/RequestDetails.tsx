import { ArrowLeft, Check, CheckCheck, Clock3, MapPin, Play, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../app/context';
import { activeAssignment, dateLabel, shortId } from '../lib/domain';
import { ConfirmDialog, Empty, PageTitle, PrivateImage, StatusBadge } from '../components/ui';
import { navigationUrl } from './collector/Tasks';
export function RequestDetails() {
  const { id } = useParams(),
    app = useApp(),
    actor = app.actor!;
  const request = app.data.requests.find((r) => r.id === id);
  const [collector, setCollector] = useState(''),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false);
  if (!request)
    return (
      <Empty
        title="Request unavailable"
        description="It may not exist, or your account may not be authorized to view it."
        action={
          <Link className="btn btn-primary" to={`/${actor.role}`}>
            Back to workspace
          </Link>
        }
      />
    );
  const assignment =
    activeAssignment(app.data, request.id) ??
    app.data.assignments.find((a) => a.request_id === id && a.status === 'completed');
  const collectorName = app.data.profiles.find((p) => p.id === assignment?.collector_id)?.name;
  const collection = app.data.collections.find((c) => c.request_id === id);
  const history = app.data.history
    .filter((h) => h.request_id === id)
    .sort((a, b) => a.changed_at.localeCompare(b.changed_at));
  const run = async (operation: () => Promise<void>, text: string) => {
    await operation();
    await app.refresh();
    app.notify(text);
  };
  return (
    <>
      <Link
        className="back-link"
        to={`/${actor.role}${actor.role === 'collector' ? '' : '/requests'}`}
      >
        <ArrowLeft size={16} />
        Back to {actor.role === 'collector' ? 'tasks' : 'requests'}
      </Link>
      <PageTitle
        eyebrow={request.request_type === 'pickup' ? 'HOUSEHOLD PICKUP' : 'PUBLIC DUMPING REPORT'}
        title={shortId(request.id)}
        description={`Submitted ${dateLabel(request.created_at, true)}`}
        action={<StatusBadge status={request.status} />}
      />
      <div className="detail-layout">
        <section className="card details-card">
          <div className="section-heading">
            <h2>Request details</h2>
            <span className="category-icon tone-sage">
              {request.request_type === 'pickup' ? <Truck size={23} /> : <MapPin size={23} />}
            </span>
          </div>
          <dl className="details-grid">
            <div>
              <dt>Waste category</dt>
              <dd>{request.waste_category}</dd>
            </div>
            <div>
              <dt>Approximate quantity</dt>
              <dd>{request.quantity || 'Not estimated'}</dd>
            </div>
            <div>
              <dt>Ward</dt>
              <dd>{request.ward}</dd>
            </div>
            <div>
              <dt>Segregation</dt>
              <dd>
                {request.request_type === 'dumping'
                  ? 'Public dumping · not confirmed'
                  : request.is_segregated
                    ? 'Confirmed by resident'
                    : 'Not confirmed'}
              </dd>
            </div>
            <div className="full-span">
              <dt>{request.request_type === 'pickup' ? 'Pickup address' : 'Site location'}</dt>
              <dd>{request.address}</dd>
            </div>
            <div>
              <dt>Coordinates</dt>
              <dd>
                {request.latitude !== null && request.longitude !== null
                  ? `${request.latitude}, ${request.longitude}`
                  : 'Not provided'}
              </dd>
            </div>
            <div>
              <dt>Preferred date</dt>
              <dd>
                {dateLabel(request.preferred_date)}
                {request.preferred_date && (
                  <small className="muted">Not a confirmed appointment</small>
                )}
              </dd>
            </div>
            <div className="full-span">
              <dt>Additional details</dt>
              <dd>{request.description || 'No additional details.'}</dd>
            </div>
          </dl>
          <PrivateImage
            path={request.image_path}
            alt="Submitted waste or dumping-site photograph"
          />
          {request.waste_category === 'E-waste & hazardous' && (
            <div className="info-note warning">
              Authorized hazardous handling required. Keep separate from regular collection.
            </div>
          )}
          <div className="detail-nav">
            <a
              className="btn btn-secondary"
              href={navigationUrl(request)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <MapPin size={16} />
              Open external navigation
            </a>
            <small className="muted">Shares the destination with Google Maps.</small>
          </div>
        </section>
        <aside>
          <section className="card timeline-card">
            <h2>Collection journey</h2>
            <ol className="timeline">
              {['Pending', 'Assigned', 'In Progress', 'Collected'].map((status, i) => {
                const entry = history.find((h) => h.new_status === status);
                return (
                  <li key={status} className={entry ? 'done' : ''}>
                    <span className="timeline-dot">{entry ? <Check size={14} /> : i + 1}</span>
                    <div>
                      <strong>{status}</strong>
                      <small>
                        {entry ? dateLabel(entry.changed_at, true) : 'Not yet recorded'}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ol>
            {['Rejected', 'Cancelled'].includes(request.status) && (
              <div className="info-note warning">
                <strong>{request.status}</strong>
                <p>{history.findLast((h) => h.new_status === request.status)?.reason}</p>
              </div>
            )}
            <div className="assigned-person">
              <Truck size={20} />
              <div>
                <small className="muted">Assigned collector</small>
                <strong>{collectorName || 'Awaiting assignment'}</strong>
              </div>
            </div>
            <p className="small muted">
              A recorded collection is not a verified treatment outcome.
            </p>
          </section>
          {actor.role === 'admin' && ['Pending', 'Assigned'].includes(request.status) && (
            <section className="card assignment-card">
              <h2>{request.status === 'Assigned' ? 'Change assignment' : 'Assign a collector'}</h2>
              <div className="field">
                <label htmlFor="collector">Authorized collector</label>
                <select
                  id="collector"
                  value={collector}
                  onChange={(e) => setCollector(e.target.value)}
                >
                  <option value="">Choose a collector</option>
                  {app.data.profiles
                    .filter((p) => p.role === 'collector')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.ward}
                      </option>
                    ))}
                </select>
              </div>
              <ConfirmDialog
                title="Confirm collector assignment"
                trigger="Assign collector"
                confirmLabel="Confirm assignment"
                onConfirm={async () => {
                  if (!collector) throw new Error('Choose an authorized collector first');
                  await run(
                    () => app.repository!.assign(actor, request.id, collector),
                    'Collector assigned.',
                  );
                }}
              >
                <p>
                  Assign this job to{' '}
                  {app.data.profiles.find((p) => p.id === collector)?.name ||
                    'the selected collector'}
                  ? Confirm they are available and equipped for this category of waste.
                </p>
              </ConfirmDialog>
            </section>
          )}
          {actor.role === 'collector' && request.status === 'Assigned' && (
            <button
              className="btn btn-primary full-width"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await run(() => app.repository!.start(actor, request.id), 'Collection started.');
                } catch (e) {
                  app.notify(e instanceof Error ? e.message : 'Could not start collection', true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Play size={17} />
              {busy ? 'Starting…' : 'Start collection'}
            </button>
          )}
          {actor.role === 'collector' && request.status === 'In Progress' && (
            <Link
              className="btn btn-primary full-width"
              to={`/collector/requests/${request.id}/confirm`}
            >
              <CheckCheck size={17} />
              Confirm physical collection
            </Link>
          )}
        </aside>
      </div>
      {collection && (
        <section className="card collection-record">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PHYSICAL COLLECTION RECORDED</p>
              <h2>Collection confirmation</h2>
            </div>
            <CheckCheck className="forest" size={28} />
          </div>
          <dl className="details-grid">
            <div>
              <dt>Collected at</dt>
              <dd>{dateLabel(collection.collected_at, true)}</dd>
            </div>
            <div>
              <dt>Collected by</dt>
              <dd>
                {app.data.profiles.find((p) => p.id === collection.collector_id)?.name ||
                  'Authorized collector'}
              </dd>
            </div>
            <div>
              <dt>Destination</dt>
              <dd>{collection.destination_name}</dd>
            </div>
            <div>
              <dt>Destination record</dt>
              <dd>
                {collection.destination_status === 'intended'
                  ? 'Intended destination only'
                  : 'Actual handover recorded by collector'}
              </dd>
            </div>
            <div>
              <dt>Destination type</dt>
              <dd>{collection.destination_type.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>Collector notes</dt>
              <dd>{collection.notes || 'No notes recorded.'}</dd>
            </div>
          </dl>
          <PrivateImage
            path={collection.proof_image_path}
            alt="Optional collection proof photograph"
          />
          <div className="info-note">
            <Clock3 size={18} />
            <span>
              {collection.destination_status === 'intended'
                ? 'This destination has not been recorded as an actual handover.'
                : 'Handover is collector-reported, not independently verified.'}{' '}
              No recycling or treatment outcome is established.
            </span>
          </div>
        </section>
      )}
      {((actor.role === 'resident' && request.status === 'Pending') ||
        (actor.role === 'admin' &&
          ['Pending', 'Assigned', 'In Progress'].includes(request.status))) && (
        <section className="card close-request">
          <h2>
            {actor.role === 'resident' ? 'No longer need this request?' : 'Request cannot proceed?'}
          </h2>
          <p className="muted small">
            Provide a reason. The change will be recorded in the status history.
          </p>
          <div className="field">
            <label htmlFor="close-reason">Reason</label>
            <input
              id="close-reason"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="At least 5 characters"
            />
          </div>
          <ConfirmDialog
            title={actor.role === 'resident' ? 'Cancel this request?' : 'Reject this request?'}
            trigger={actor.role === 'resident' ? 'Cancel request' : 'Reject request'}
            danger
            confirmLabel={actor.role === 'resident' ? 'Confirm cancellation' : 'Confirm rejection'}
            onConfirm={() =>
              run(
                () =>
                  app.repository!.close(
                    actor,
                    request.id,
                    actor.role === 'resident' ? 'Cancelled' : 'Rejected',
                    reason,
                  ),
                'Request status updated.',
              )
            }
          >
            <p>This closes the request without recording physical collection.</p>
          </ConfirmDialog>
        </section>
      )}
    </>
  );
}
