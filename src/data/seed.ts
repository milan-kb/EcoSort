import type { Profile, Snapshot, Status, WasteRequest } from '../types/domain';
export function createSeed(): Snapshot {
  const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const time = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const profiles: Profile[] = [
    {
      id: uid(1),
      auth_user_id: uid(1),
      name: 'Anjali Menon',
      phone: '9999900001',
      ward: 'Ward 3',
      role: 'resident',
      created_at: time(20),
    },
    {
      id: uid(2),
      auth_user_id: uid(2),
      name: 'Ravi Kumar',
      phone: '9999900002',
      ward: 'Ward 3',
      role: 'collector',
      created_at: time(20),
    },
    {
      id: uid(3),
      auth_user_id: uid(3),
      name: 'Fathima Ali',
      phone: '9999900003',
      ward: 'Ward 2',
      role: 'collector',
      created_at: time(20),
    },
    {
      id: uid(4),
      auth_user_id: uid(4),
      name: 'Priya Nair',
      phone: '9999900004',
      ward: 'Ward 1',
      role: 'admin',
      created_at: time(20),
    },
    {
      id: uid(5),
      auth_user_id: uid(5),
      name: 'Arun Das',
      phone: '9999900005',
      ward: 'Ward 1',
      role: 'resident',
      created_at: time(20),
    },
  ];
  const specs: [
    WasteRequest['request_type'],
    WasteRequest['waste_category'],
    Status,
    string,
    string,
    number,
  ][] = [
    ['pickup', 'Organic', 'Pending', 'Ward 3', 'Sample home 12, garden lane', 0],
    ['pickup', 'Plastic', 'Assigned', 'Ward 2', 'Sample home 8, school lane', 1],
    ['dumping', 'Mixed', 'Pending', 'Ward 1', 'Synthetic roadside site, east junction', 8],
    ['pickup', 'Paper & cardboard', 'Collected', 'Ward 4', 'Sample home 24, north lane', 3],
    ['dumping', 'Glass', 'In Progress', 'Ward 5', 'Synthetic public plot, west lane', 2],
    ['pickup', 'Metal', 'Collected', 'Ward 3', 'Sample home 12, garden lane', 5],
    ['dumping', 'Unknown', 'Pending', 'Ward 6', 'Synthetic roadside site, market lane', 6],
    ['pickup', 'E-waste & hazardous', 'Pending', 'Ward 2', 'Sample home 8, school lane', 2],
    ['pickup', 'Organic', 'Rejected', 'Ward 1', 'Sample home 4, south lane', 7],
    ['pickup', 'Plastic', 'Cancelled', 'Ward 3', 'Sample home 12, garden lane', 4],
    ['dumping', 'Plastic', 'Collected', 'Ward 4', 'Synthetic footpath site, canal lane', 9],
    ['pickup', 'Glass', 'Assigned', 'Ward 5', 'Sample home 31, west lane', 1],
  ];
  const requests = specs.map(
    ([request_type, waste_category, status, ward, address, days], i): WasteRequest => ({
      id: `${String(10000001 + i)}-0000-4000-8000-000000000000`,
      resident_id: i % 3 === 0 || i === 1 || i === 5 ? uid(1) : uid(5),
      request_type,
      waste_category,
      quantity: request_type === 'pickup' ? `${(i % 3) + 1} small bags` : 'Not estimated',
      ward,
      address,
      latitude: 10.303 + (i % 4) * 0.004,
      longitude: 76.196 + Math.floor(i / 4) * 0.006,
      description:
        request_type === 'dumping'
          ? 'Fictional demonstration report. Waste has accumulated beside a public path.'
          : 'Fictional household pickup. Waste is stored separately.',
      image_path: null,
      preferred_date: null,
      is_segregated: request_type === 'pickup',
      status,
      created_at: time(days),
      updated_at: time(Math.max(0, days - 1)),
    }),
  );
  const assignments = requests
    .filter((r) => ['Assigned', 'In Progress', 'Collected'].includes(r.status))
    .map((r, i) => ({
      id: uid(100 + i),
      request_id: r.id,
      collector_id: uid((i % 2) + 2),
      assigned_by: uid(4),
      assigned_at: r.created_at,
      status: r.status === 'Collected' ? ('completed' as const) : ('active' as const),
    }));
  const collections = requests
    .filter((r) => r.status === 'Collected')
    .map((r, i) => ({
      id: uid(200 + i),
      request_id: r.id,
      collector_id: assignments.find((a) => a.request_id === r.id)!.collector_id,
      collected_at: r.updated_at,
      proof_image_path: null,
      notes: 'Synthetic collection record for classroom demonstration.',
      destination_type: 'sorting' as const,
      destination_name: 'Demo sorting point (fictional)',
      destination_status: i === 0 ? ('handed_over' as const) : ('intended' as const),
    }));
  const history = requests.flatMap((r, i) => {
    const trail: Status[] = ['Pending'];
    if (['Assigned', 'In Progress', 'Collected'].includes(r.status)) trail.push('Assigned');
    if (['In Progress', 'Collected'].includes(r.status)) trail.push('In Progress');
    if (['Collected', 'Cancelled', 'Rejected'].includes(r.status)) trail.push(r.status);
    return trail.map((s, j) => ({
      id: uid(300 + i * 5 + j),
      request_id: r.id,
      previous_status: j ? trail[j - 1] : null,
      new_status: s,
      changed_by: j ? uid(4) : r.resident_id,
      changed_at: j ? r.updated_at : r.created_at,
      reason:
        s === 'Rejected'
          ? 'Synthetic example: collection capacity unavailable.'
          : s === 'Cancelled'
            ? 'Synthetic example: resident no longer needs pickup.'
            : null,
    }));
  });
  return { profiles, requests, assignments, collections, history };
}
