import { useState } from 'react';
import { ArrowRight, ClipboardList, MapPin, Search, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/context';
import { dateLabel, isOverdue, shortId, wards } from '../lib/domain';
import { categories, statuses, type WasteRequest } from '../types/domain';
import { Empty, StatusBadge } from './ui';
export function RequestList({
  requests,
  limit,
  table = false,
}: {
  requests: WasteRequest[];
  limit?: number;
  table?: boolean;
}) {
  const { actor } = useApp();
  const sorted = [...requests]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
  if (!sorted.length)
    return (
      <Empty
        title="No requests to show"
        description="Try another filter, or create your first request."
      />
    );
  return table ? (
    <div className="table-scroll">
      <table className="requests-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>Category</th>
            <th>Ward & location</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id}>
              <td>
                <Link className="request-id" to={`/${actor!.role}/requests/${r.id}`}>
                  {shortId(r.id)}
                </Link>
                <small>{r.request_type === 'pickup' ? 'Household pickup' : 'Open dumping'}</small>
              </td>
              <td>{r.waste_category}</td>
              <td>
                {r.ward}
                <small className="location-cell">{r.address}</small>
              </td>
              <td>
                {dateLabel(r.created_at)}
                {isOverdue(r) && <small className="overdue">Needs follow-up</small>}
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td>
                <Link
                  className="icon-button"
                  aria-label={`View ${shortId(r.id)}`}
                  to={`/${actor!.role}/requests/${r.id}`}
                >
                  <ArrowRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="request-cards">
      {sorted.map((r) => (
        <Link className="request-card" to={`/${actor!.role}/requests/${r.id}`} key={r.id}>
          <span
            className={`request-type-icon ${r.request_type === 'dumping' ? 'dumping-icon' : ''}`}
          >
            {r.request_type === 'pickup' ? <Truck size={22} /> : <MapPin size={22} />}
          </span>
          <div className="request-card-main">
            <div className="request-card-top">
              <span className="request-id">{shortId(r.id)}</span>
              <span className="muted small">{dateLabel(r.created_at)}</span>
            </div>
            <h3>
              {r.waste_category}{' '}
              <span className="muted">
                · {r.request_type === 'pickup' ? 'Household pickup' : 'Open dumping'}
              </span>
            </h3>
            <p className="muted small">
              {r.ward} · {r.address}
            </p>
            <div className="request-card-status">
              <StatusBadge status={r.status} />
              {isOverdue(r) && <span className="overdue small">Needs follow-up</span>}
            </div>
          </div>
          <ArrowRight size={18} className="card-arrow" />
        </Link>
      ))}
    </div>
  );
}
export function FilteredRequests({
  requests,
  table = false,
}: {
  requests: WasteRequest[];
  table?: boolean;
}) {
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [ward, setWard] = useState(''),
    [category, setCategory] = useState(''),
    [kind, setKind] = useState(''),
    [overdue, setOverdue] = useState(false),
    [page, setPage] = useState(1);
  const filtered = requests
    .filter(
      (r) =>
        (!status || r.status === status) &&
        (!ward || r.ward === ward) &&
        (!category || r.waste_category === category) &&
        (!kind || r.request_type === kind) &&
        (!overdue || isOverdue(r)) &&
        `${shortId(r.id)} ${r.address} ${r.waste_category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pages = Math.max(1, Math.ceil(filtered.length / 8)),
    current = Math.min(page, pages);
  return (
    <>
      <div className="filters">
        <div className="search-field">
          <Search size={17} />
          <input
            type="search"
            aria-label="Search requests"
            placeholder="Search ID, category or location…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter ward"
          value={ward}
          onChange={(e) => {
            setWard(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All wards</option>
          {[...new Set([...wards, ...requests.map((r) => r.ward)])].map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
        <select
          aria-label="Filter waste category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Filter request type"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Both request types</option>
          <option value="pickup">Household pickups</option>
          <option value="dumping">Open dumping reports</option>
        </select>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => {
              setOverdue(e.target.checked);
              setPage(1);
            }}
          />
          Needs follow-up
        </label>
      </div>
      <div className="filter-summary">
        <span>
          <ClipboardList size={15} />
          {filtered.length} {filtered.length === 1 ? 'request' : 'requests'}
        </span>
        <button
          className="text-button"
          onClick={() => {
            setSearch('');
            setStatus('');
            setWard('');
            setCategory('');
            setKind('');
            setOverdue(false);
            setPage(1);
          }}
        >
          Clear filters
        </button>
      </div>
      <RequestList requests={filtered.slice((current - 1) * 8, current * 8)} table={table} />
      {pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <span className="small muted">
            Page {current} of {pages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
