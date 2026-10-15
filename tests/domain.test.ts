import { beforeEach, describe, expect, it } from 'vitest';
import { DemoRepository, DEMO_KEY } from '../src/services/demo';
import { createSeed } from '../src/data/seed';
import { requestSchema, statistics } from '../src/lib/domain';
import type { RequestInput } from '../src/types/domain';

const input: RequestInput = {
  request_type: 'pickup',
  waste_category: 'Plastic',
  quantity: '2 bags',
  ward: 'Ward 1',
  address: 'Test household, north lane',
  latitude: null,
  longitude: null,
  description: '',
  preferred_date: null,
  is_segregated: true,
};
const [resident, collector, , admin] = createSeed().profiles;
let repo: DemoRepository;
beforeEach(() => {
  localStorage.clear();
  repo = new DemoRepository(localStorage);
});
describe('shared collection workflow', () => {
  it('creates and persists a pending household request', async () => {
    const id = await repo.create(resident, input);
    expect((await repo.load(resident)).requests.find((r) => r.id === id)?.status).toBe('Pending');
    expect(
      (await new DemoRepository(localStorage).load(resident)).requests.some((r) => r.id === id),
    ).toBe(true);
  });
  it('validates required fields and segregation confirmation', () => {
    expect(
      requestSchema.safeParse({ ...input, address: '', quantity: '', is_segregated: false })
        .success,
    ).toBe(false);
    expect(requestSchema.safeParse({ ...input, waste_category: 'Mixed' }).success).toBe(false);
    expect(requestSchema.safeParse({ ...input, latitude: 100, longitude: 76 }).success).toBe(false);
    expect(requestSchema.safeParse({ ...input, latitude: 10, longitude: null }).success).toBe(
      false,
    );
    expect(requestSchema.safeParse({ ...input, preferred_date: '2026-02-30' }).success).toBe(false);
  });
  it('accepts a separate dumping report with mixed waste', async () => {
    const id = await repo.create(resident, {
      ...input,
      request_type: 'dumping',
      waste_category: 'Mixed',
      description: 'Waste beside the public footpath',
      is_segregated: false,
    });
    expect((await repo.load(admin)).requests.find((r) => r.id === id)?.request_type).toBe(
      'dumping',
    );
  });
  it('assigns, scopes collector jobs, records collection and updates resident and totals', async () => {
    const id = await repo.create(resident, input);
    const before = statistics((await repo.load(admin)).requests);
    await repo.assign(admin, id, collector.id);
    expect((await repo.load(collector)).requests.some((r) => r.id === id)).toBe(true);
    await repo.start(collector, id);
    await repo.complete(collector, id, {
      confirmed: true,
      notes: 'Bags collected',
      destination_type: 'sorting',
      destination_name: 'Synthetic sorting point',
      destination_status: 'intended',
    });
    const result = await repo.load(resident);
    expect(result.requests.find((r) => r.id === id)?.status).toBe('Collected');
    expect(result.collections.find((c) => c.request_id === id)?.destination_status).toBe(
      'intended',
    );
    expect(result.history.filter((h) => h.request_id === id).map((h) => h.new_status)).toEqual([
      'Pending',
      'Assigned',
      'In Progress',
      'Collected',
    ]);
    expect(statistics((await repo.load(admin)).requests).collected).toBe(before.collected + 1);
  });
  it('blocks unauthorized access and role escalation', async () => {
    const id = await repo.create(resident, input);
    await expect(repo.assign(resident, id, collector.id)).rejects.toThrow('authorized');
    await expect(repo.load({ ...resident, role: 'admin' })).rejects.toThrow('authorized');
    expect((await repo.load(collector)).requests.some((r) => r.id === id)).toBe(false);
  });
  it('rejects invalid transitions and unconfirmed collection', async () => {
    const id = await repo.create(resident, input);
    await expect(repo.start(collector, id)).rejects.toThrow();
    await repo.assign(admin, id, collector.id);
    await expect(
      repo.complete(collector, id, {
        confirmed: true,
        notes: '',
        destination_name: 'Point',
        destination_type: 'sorting',
        destination_status: 'intended',
      }),
    ).rejects.toThrow('transition');
    await repo.start(collector, id);
    await expect(
      repo.complete(collector, id, {
        confirmed: false,
        notes: '',
        destination_name: 'Point',
        destination_type: 'sorting',
        destination_status: 'intended',
      }),
    ).rejects.toThrow();
  });
  it('resets only demo data', async () => {
    localStorage.setItem('unrelated', 'keep');
    const id = await repo.create(resident, input);
    repo.reset();
    expect((await repo.load(resident)).requests.some((r) => r.id === id)).toBe(false);
    expect(localStorage.getItem('unrelated')).toBe('keep');
    expect(localStorage.getItem(DEMO_KEY)).toBeTruthy();
  });
  it('reassignment revokes the former collector before work starts', async () => {
    const collector2 = createSeed().profiles[2];
    const id = await repo.create(resident, input);
    await repo.assign(admin, id, collector.id);
    await repo.assign(admin, id, collector2.id);
    expect((await repo.load(collector)).requests.some((r) => r.id === id)).toBe(false);
    await expect(repo.start(collector, id)).rejects.toThrow();
    await repo.start(collector2, id);
    await expect(repo.assign(admin, id, collector.id)).rejects.toThrow();
  });
  it('allows residents to cancel only pending requests with a reason', async () => {
    const id = await repo.create(resident, input);
    await expect(repo.close(resident, id, 'Cancelled', '')).rejects.toThrow();
    await repo.close(resident, id, 'Cancelled', 'No longer needed');
    await expect(repo.close(admin, id, 'Rejected', 'Cannot proceed')).rejects.toThrow('transition');
    const second = await repo.create(resident, input);
    await repo.assign(admin, second, collector.id);
    await expect(repo.close(resident, second, 'Cancelled', 'No longer needed')).rejects.toThrow(
      'authorized',
    );
  });
  it('requires authorized hazardous handling and preserves the in-progress job on failure', async () => {
    const id = await repo.create(resident, { ...input, waste_category: 'E-waste & hazardous' });
    await repo.assign(admin, id, collector.id);
    await repo.start(collector, id);
    await expect(
      repo.complete(collector, id, {
        confirmed: true,
        notes: '',
        destination_name: 'Ordinary sorting',
        destination_type: 'sorting',
        destination_status: 'intended',
      }),
    ).rejects.toThrow('authorized handling');
    expect((await repo.load(resident)).requests.find((r) => r.id === id)?.status).toBe(
      'In Progress',
    );
    await repo.complete(collector, id, {
      confirmed: true,
      notes: '',
      destination_name: 'Synthetic authorized handler',
      destination_type: 'authorized_hazardous',
      destination_status: 'handed_over',
    });
    expect(
      (await repo.load(resident)).collections.find((c) => c.request_id === id)?.destination_status,
    ).toBe('handed_over');
  });
  it('reports corrupt storage without silently overwriting it', async () => {
    localStorage.setItem(DEMO_KEY, '{broken');
    await expect(repo.load(resident)).rejects.toThrow('Reset the demo');
    expect(localStorage.getItem(DEMO_KEY)).toBe('{broken');
    repo.reset();
    expect((await repo.load(resident)).requests.length).toBeGreaterThan(0);
  });
});
