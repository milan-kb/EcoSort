import { ArrowRight, BookOpen, CheckCheck, Clock3, Leaf, MapPin, Plus, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/context';
import { PageTitle, TextLink } from '../../components/ui';
import { FilteredRequests, RequestList } from '../../components/Requests';
import { statistics } from '../../lib/domain';
export function ResidentHome() {
  const { actor, data } = useApp(),
    stats = statistics(data.requests);
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE CARE GOES A LONG WAY"
        title={`Hello, ${actor!.name.split(' ')[0]}.`}
        description="Let’s make our neighbourhood a little cleaner, together."
      />
      <section className="resident-hero">
        <div>
          <span className="hero-pill">
            <Leaf size={15} />
            YOUR HOME. OUR SHARED ENVIRONMENT.
          </span>
          <h2>
            Separated at home.
            <br />
            Collected with care.
          </h2>
          <p>
            Keep your waste categories separate.
            <br />
            We’ll help you coordinate the next step.
          </p>
          <Link className="btn btn-light" to="/resident/pickup">
            <Plus size={18} />
            Request waste pickup
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="bins-illustration" aria-hidden="true">
          {['ORGANIC', 'DRY', 'SPECIAL'].map((label, i) => (
            <div className={`bin bin-${i}`} key={label}>
              <div className="bin-lid" />
              <div className="bin-body">
                <Leaf size={24} />
                <span>{label}</span>
                <i />
                <i />
              </div>
              <div className="bin-wheel" />
            </div>
          ))}
          <span className="bin-caption">Different materials. Different journeys.</span>
        </div>
      </section>
      <div className="resident-actions">
        <Link to="/resident/dumping" className="action-card">
          <span className="category-icon tone-sand">
            <MapPin size={24} />
          </span>
          <div>
            <h2>Spot open dumping?</h2>
            <p>Help bring attention to a public space.</p>
          </div>
          <ArrowRight size={19} />
        </Link>
        <Link to="/resident/guide" className="action-card">
          <span className="category-icon tone-sage">
            <BookOpen size={24} />
          </span>
          <div>
            <h2>Not sure how to separate?</h2>
            <p>Your practical segregation guide.</p>
          </div>
          <ArrowRight size={19} />
        </Link>
      </div>
      <div className="stats-grid resident-stats">
        {[
          { label: 'Awaiting review', value: stats.pending, icon: Clock3 },
          { label: 'Collection underway', value: stats.active, icon: Truck },
          { label: 'Collected', value: stats.collected, icon: CheckCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <Icon size={20} />
            <div>
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>
      <section className="card recent-section">
        <div className="section-heading">
          <div>
            <h2>Your recent requests</h2>
            <p className="muted small">Every step, from your doorstep to the next destination.</p>
          </div>
          <TextLink to="/resident/requests">View all</TextLink>
        </div>
        <RequestList requests={data.requests} limit={3} />
      </section>
      <div className="quiet-note">
        <Leaf size={18} />
        <p>
          Collection is only confirmed when an assigned collector records it. Collection does not
          mean recycling or treatment has been verified.
        </p>
      </div>
    </>
  );
}
export function MyRequests() {
  const { data } = useApp();
  return (
    <>
      <PageTitle
        eyebrow="FOLLOW THE JOURNEY"
        title="My requests"
        description="Household pickups and public dumping reports, kept distinct."
        action={
          <Link className="btn btn-primary" to="/resident/pickup">
            <Plus size={17} />
            New pickup
          </Link>
        }
      />
      <section className="card">
        <FilteredRequests requests={data.requests} />
      </section>
    </>
  );
}
