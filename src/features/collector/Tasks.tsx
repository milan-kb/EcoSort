import { ArrowRight, MapPin, Play, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../../app/context';
import { Empty, PageTitle, StatusBadge } from '../../components/ui';
import { shortId, validCoordinates } from '../../lib/domain';
import type { WasteRequest } from '../../types/domain';
export function navigationUrl(r: WasteRequest) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(validCoordinates(r.latitude, r.longitude) ? `${r.latitude},${r.longitude}` : `${r.address}, Vellangallur, Kerala`)}`;
}
export function Tasks() {
  const { data, actor, repository, refresh, notify } = useApp(),
    [busy, setBusy] = useState(''),
    [showCompleted, setShowCompleted] = useState(false);
  const tasks = data.requests.filter((r) =>
    showCompleted ? r.status === 'Collected' : ['Assigned', 'In Progress'].includes(r.status),
  );
  return (
    <>
      <PageTitle
        eyebrow="ONE PICKUP AT A TIME"
        title={`Your tasks, ${actor!.name.split(' ')[0]}.`}
        description="Only jobs assigned to you are shown. Start a job before recording collection."
      />
      <div className="task-tabs">
        <button className={!showCompleted ? 'active' : ''} onClick={() => setShowCompleted(false)}>
          Active jobs{' '}
          <span>
            {data.requests.filter((r) => ['Assigned', 'In Progress'].includes(r.status)).length}
          </span>
        </button>
        <button className={showCompleted ? 'active' : ''} onClick={() => setShowCompleted(true)}>
          Collected <span>{data.requests.filter((r) => r.status === 'Collected').length}</span>
        </button>
      </div>
      {!tasks.length ? (
        <Empty
          title={showCompleted ? 'No completed jobs yet' : 'You’re all caught up'}
          description="An administrator assigns new jobs. Check back when collection is coordinated."
        />
      ) : (
        <div className="task-grid">
          {tasks.map((r) => (
            <article className="card task-card" key={r.id}>
              <div className="section-heading">
                <span className="request-id">{shortId(r.id)}</span>
                <StatusBadge status={r.status} />
              </div>
              <span className="task-kind">
                <Truck size={15} />
                {r.request_type === 'pickup' ? 'Household pickup' : 'Public dumping collection'}
              </span>
              <h2>{r.waste_category}</h2>
              <p className="task-address">
                <MapPin size={18} />
                {r.address}
              </p>
              <div className="task-meta">
                <span>{r.ward}</span>
                <span>{r.quantity}</span>
                <span>
                  {r.is_segregated ? 'Segregation confirmed' : 'Segregation not confirmed'}
                </span>
              </div>
              {r.waste_category === 'E-waste & hazardous' && (
                <p className="field-error">
                  Authorized hazardous handling required. Do not mix with ordinary collection.
                </p>
              )}
              <div className="task-buttons">
                <Link className="btn btn-secondary" to={`/collector/requests/${r.id}`}>
                  View details
                  <ArrowRight size={16} />
                </Link>
                <a
                  className="btn btn-secondary"
                  href={navigationUrl(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Navigate
                  <MapPin size={16} />
                </a>
                {r.status === 'Assigned' && (
                  <button
                    className="btn btn-primary"
                    disabled={!!busy}
                    onClick={async () => {
                      setBusy(r.id);
                      try {
                        await repository!.start(actor!, r.id);
                        await refresh();
                        notify('Collection started.');
                      } catch (e) {
                        notify(e instanceof Error ? e.message : 'Could not start job', true);
                      } finally {
                        setBusy('');
                      }
                    }}
                  >
                    <Play size={16} />
                    {busy === r.id ? 'Starting…' : 'Start collection'}
                  </button>
                )}
                {r.status === 'In Progress' && (
                  <Link className="btn btn-primary" to={`/collector/requests/${r.id}/confirm`}>
                    Confirm collection
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="quiet-note">
        <Truck size={18} />
        <p>
          Open navigation sends the destination to an external map service. Never record collection
          until the waste has been physically collected.
        </p>
      </div>
    </>
  );
}
