import { lazy, Suspense } from 'react';
import {
  ArrowRight,
  CheckCheck,
  ClipboardList,
  Clock3,
  MapPin,
  Truck,
  UserRoundPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/context';
import { FilteredRequests, RequestList } from '../../components/Requests';
import { PageTitle, TextLink } from '../../components/ui';
import { isOverdue, statistics } from '../../lib/domain';
import { CategoryChart } from './Analytics';
const WasteMap = lazy(() => import('../maps/WasteMap'));
export function Dashboard() {
  const { data } = useApp(),
    stats = statistics(data.requests),
    overdue = data.requests.filter(isOverdue).length;
  const cards = [
    {
      label: 'Total requests',
      value: stats.total,
      icon: ClipboardList,
      note: 'Pickups & dumping reports',
    },
    { label: 'Pending review', value: stats.pending, icon: Clock3, note: 'Awaiting coordination' },
    {
      label: 'Active collections',
      value: stats.active,
      icon: Truck,
      note: 'Assigned or in progress',
    },
    {
      label: 'Collected',
      value: stats.collected,
      icon: CheckCheck,
      note: `${stats.rate}% collection completion`,
    },
    {
      label: 'Unassigned jobs',
      value: stats.unassigned,
      icon: UserRoundPlus,
      note: 'Needs a collection partner',
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="PANCHAYAT WORKSPACE"
        title="A cleaner community, in view."
        description="Coordinate collection. Support responsible habits. Keep the loop accountable."
        action={
          <Link className="btn btn-primary" to="/admin/assignments">
            <UserRoundPlus size={17} />
            Manage assignments
          </Link>
        }
      />
      <div className="stats-grid admin-stats">
        {cards.map(({ label, value, icon: Icon, note }) => (
          <div className="stat-card" key={label}>
            <div className="stat-card-head">
              <span className="stat-label">{label}</span>
              <Icon size={18} />
            </div>
            <span
              className="stat-value"
              data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}
            >
              {value}
            </span>
            <span className="stat-note">{note}</span>
          </div>
        ))}
      </div>
      <section className="attention-strip">
        <span className="category-icon tone-sand">
          <Clock3 size={21} />
        </span>
        <div>
          <h2>
            {stats.unassigned
              ? `${stats.unassigned} requests need a next step.`
              : 'Every request has a next step.'}
          </h2>
          <p>
            {overdue} need follow-up ·{' '}
            {
              data.requests.filter((r) => r.request_type === 'dumping' && r.status === 'Pending')
                .length
            }{' '}
            public dumping reports awaiting review
          </p>
        </div>
        <Link className="text-link" to="/admin/assignments">
          Review queue
          <ArrowRight size={16} />
        </Link>
      </section>
      <div className="dashboard-charts">
        <CategoryChart />
        <div className="card impact-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PROGRESS, NOT PROMISES</p>
              <h2>Closing the collection loop</h2>
            </div>
            <CheckCheck size={24} />
          </div>
          <div className="completion-number">
            {stats.rate}
            <span>%</span>
          </div>
          <p>Collection completion rate</p>
          <div className="progress-track">
            <span style={{ width: `${stats.rate}%` }} />
          </div>
          <p className="small muted">
            Collected ÷ eligible requests. Cancelled and rejected records excluded. Collection does
            not establish recycling or treatment.
          </p>
          <div className="impact-divider" />
          <div className="section-heading">
            <span>Households confirming segregation</span>
            <strong>{stats.segregated}</strong>
          </div>
          <TextLink to="/admin/analytics">Explore analytics</TextLink>
        </div>
      </div>
      <section className="card recent-section">
        <div className="section-heading">
          <div>
            <h2>Recent requests</h2>
            <p className="muted small">The latest activity across the community.</p>
          </div>
          <TextLink to="/admin/requests">View all requests</TextLink>
        </div>
        <RequestList requests={data.requests} limit={5} table />
      </section>
      <div className="quiet-note">
        <MapPin size={18} />
        <p>
          Household locations are private to authorized users. All demo locations are synthetic, not
          actual reports.
        </p>
      </div>
    </>
  );
}
export function AllRequests({ assignments = false }: { assignments?: boolean }) {
  const { data } = useApp();
  return (
    <>
      <PageTitle
        eyebrow="COLLECTION COORDINATION"
        title={assignments ? 'Assignment queue' : 'All requests'}
        description={
          assignments
            ? 'Open a request to assign or change its collector before work begins. Hazardous waste requires an authorized handler.'
            : 'Review household pickups and public dumping reports. Filter by status, ward or material.'
        }
      />
      <section className="card">
        <FilteredRequests
          key={String(assignments)}
          requests={
            assignments
              ? data.requests.filter((r) => ['Pending', 'Assigned'].includes(r.status))
              : data.requests
          }
          table
        />
      </section>
      {assignments && (
        <div className="info-note">
          After collection starts, the assignment is locked. Review destination and evidence in the
          request details. Preferred dates are requests, not promised appointments.
        </div>
      )}
    </>
  );
}
export function MapPage() {
  const { data } = useApp();
  return (
    <>
      <PageTitle
        eyebrow="AUTHORIZED OPERATIONAL VIEW"
        title="Waste map"
        description="Household pickups and public dumping reports. Marker colors show the current collection status."
      />
      <Suspense fallback={<p>Loading map…</p>}>
        <WasteMap requests={data.requests} />
      </Suspense>
      <div className="info-note">
        Only valid stored coordinates are shown. Private household locations never appear on a
        public map. Use All Requests to review records without coordinates.
      </div>
    </>
  );
}
