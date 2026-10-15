import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../app/context';
import { statistics } from '../../lib/domain';
import { PageTitle } from '../../components/ui';
import type { WasteRequest } from '../../types/domain';
const colors = [
  '#284e3b',
  '#759974',
  '#b7c79a',
  '#d5c69d',
  '#8cabbb',
  '#b99595',
  '#aca3bc',
  '#b3b9ad',
];
function group(requests: WasteRequest[], field: 'ward' | 'waste_category') {
  return [...new Set(requests.map((r) => r[field]))].map((name) => ({
    name,
    count: requests.filter((r) => r[field] === name).length,
  }));
}
export function CategoryChart() {
  const { data } = useApp(),
    grouped = group(data.requests, 'waste_category');
  return (
    <div className="card chart-card">
      <div className="section-heading">
        <div>
          <h2>Waste by category</h2>
          <p className="muted small">All submitted requests</p>
        </div>
        <span className="badge">{data.requests.length} records</span>
      </div>
      {grouped.length ? (
        <div className="category-chart">
          <div
            className="donut-wrapper"
            role="img"
            aria-label={`Requests by category: ${grouped.map((g) => `${g.name}: ${g.count}`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={grouped}
                  dataKey="count"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {grouped.map((g, i) => (
                    <Cell key={g.name} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{data.requests.length}</strong>
              <span>requests</span>
            </div>
          </div>
          <ul className="chart-legend">
            {grouped.map((g, i) => (
              <li key={g.name}>
                <span>
                  <i style={{ background: colors[i % colors.length] }} />
                  {g.name}
                </span>
                <strong>{g.count}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No data yet.</p>
      )}
    </div>
  );
}
export function WardChart() {
  const { data } = useApp();
  const grouped = group(data.requests, 'ward');
  return (
    <div className="card chart-card">
      <div className="section-heading">
        <div>
          <h2>Requests by ward</h2>
          <p className="muted small">Where collection is needed</p>
        </div>
      </div>
      <div
        role="img"
        aria-label={`Requests by ward: ${grouped.map((g) => `${g.name}: ${g.count}`).join(', ')}`}
        className="bar-wrapper"
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={grouped} margin={{ left: -24, right: 8, top: 16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e9e2" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#66716a' }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#66716a' }}
            />
            <Tooltip cursor={{ fill: '#eef2e9' }} />
            <Bar
              dataKey="count"
              name="Requests"
              fill="#658965"
              radius={[5, 5, 0, 0]}
              maxBarSize={34}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
export function Analytics() {
  const { data, demo } = useApp(),
    stats = statistics(data.requests);
  const activity = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return {
      date: day.slice(5),
      requests: data.requests.filter((r) => r.created_at.slice(0, 10) === day).length,
    };
  });
  return (
    <>
      <PageTitle
        eyebrow="UNDERSTAND THE BIGGER PICTURE"
        title="Collection analytics"
        description={
          demo
            ? 'Derived from stored fictional demo records. Updates when the workflow changes.'
            : 'Derived from records visible to your authorized account.'
        }
      />
      <div className="analytics-highlight card">
        <div>
          <span className="eyebrow">COLLECTION COMPLETION RATE</span>
          <h2>{stats.rate}%</h2>
          <p className="muted">
            {stats.collected} of{' '}
            {data.requests.filter((r) => !['Cancelled', 'Rejected'].includes(r.status)).length}{' '}
            eligible requests collected.
          </p>
        </div>
        <div>
          <div className="progress-track">
            <span style={{ width: `${stats.rate}%` }} />
          </div>
          <p className="small muted">
            Cancelled and rejected requests are excluded from the denominator. This is collection,
            not verified treatment.
          </p>
        </div>
      </div>
      <div className="two-grid">
        <CategoryChart />
        <WardChart />
      </div>
      <div className="card chart-card">
        <h2>Request activity</h2>
        <p className="muted small">Daily submissions over the last 14 days · UTC dates</p>
        <div
          className="bar-wrapper"
          role="img"
          aria-label={`Daily activity: ${activity.map((a) => `${a.date}: ${a.requests}`).join(', ')}`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={activity}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="requests" fill="#284e3b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="info-note">
        Segregation: {stats.segregated} household requests explicitly confirmed separation.
        Confirmation is self-reported, not independently verified.
      </div>
    </>
  );
}
