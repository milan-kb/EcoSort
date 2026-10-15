import { createSeed } from '../data/seed';
import {
  activeAssignment,
  assertTransition,
  canRead,
  collectionSchema,
  profileSchema,
  requestSchema,
  validateDestination,
} from '../lib/domain';
import { dataUrl } from '../lib/images';
import { snapshotSchema } from '../lib/snapshot';
import type {
  CollectionInput,
  Profile,
  Repository,
  RequestInput,
  Snapshot,
  Status,
  WasteRequest,
} from '../types/domain';
export const DEMO_KEY = 'ecosort-demo-v1';
export class DemoRepository implements Repository {
  constructor(private storage: Storage) {}
  private read(): Snapshot {
    const raw = this.storage.getItem(DEMO_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!snapshotSchema.safeParse(parsed).success) throw new Error();
        return parsed;
      } catch {
        throw new Error(
          'Demo data could not be read. Reset the demo to restore fictional examples.',
        );
      }
    }
    const seed = createSeed();
    this.save(seed);
    return seed;
  }
  private save(data: Snapshot) {
    // ponytail: browser-local last-writer-wins; connected mode is required for
    // concurrent multi-user writes. Demo role changes use one sequential store.
    try {
      this.storage.setItem(DEMO_KEY, JSON.stringify(data));
    } catch {
      throw new Error(
        'Browser storage is full or unavailable. Remove the optional image or reset demo data; no changes were saved.',
      );
    }
  }
  private actor(data: Snapshot, actor: Profile) {
    const stored = data.profiles.find(
      (p) => p.id === actor.id && p.role === actor.role && p.auth_user_id === actor.auth_user_id,
    );
    if (!stored) throw new Error('Not authorized');
    return stored;
  }
  private job(data: Snapshot, actor: Profile, id: string) {
    this.actor(data, actor);
    const r = data.requests.find((r) => r.id === id);
    if (!r || !canRead(actor, r, data)) throw new Error('Request not found or not authorized');
    return r;
  }
  private transition(
    data: Snapshot,
    r: WasteRequest,
    actor: Profile,
    to: Status,
    reason: string | null = null,
  ) {
    assertTransition(r.status, to);
    const now = new Date().toISOString();
    data.history.push({
      id: crypto.randomUUID(),
      request_id: r.id,
      previous_status: r.status,
      new_status: to,
      changed_by: actor.id,
      changed_at: now,
      reason,
    });
    r.status = to;
    r.updated_at = now;
  }
  async load(actor: Profile): Promise<Snapshot> {
    const data = this.read();
    this.actor(data, actor);
    const requests = data.requests.filter((r) => canRead(actor, r, data));
    const ids = new Set(requests.map((r) => r.id));
    const assignments = data.assignments.filter((a) => ids.has(a.request_id));
    const collectors = new Set(assignments.map((a) => a.collector_id));
    return {
      requests,
      profiles: data.profiles.filter(
        (p) => actor.role === 'admin' || p.id === actor.id || collectors.has(p.id),
      ),
      assignments,
      collections: data.collections.filter((c) => ids.has(c.request_id)),
      history: data.history.filter((h) => ids.has(h.request_id)),
    };
  }
  async create(actor: Profile, input: RequestInput, image?: File) {
    const parsed = requestSchema.parse(input);
    const image_path = image ? await dataUrl(image) : null;
    const data = this.read();
    this.actor(data, actor);
    if (actor.role !== 'resident') throw new Error('Not authorized');
    const id = crypto.randomUUID(),
      now = new Date().toISOString();
    data.requests.unshift({
      ...parsed,
      id,
      image_path,
      resident_id: actor.id,
      status: 'Pending',
      created_at: now,
      updated_at: now,
    });
    data.history.push({
      id: crypto.randomUUID(),
      request_id: id,
      previous_status: null,
      new_status: 'Pending',
      changed_by: actor.id,
      changed_at: now,
      reason: null,
    });
    this.save(data);
    return id;
  }
  async assign(actor: Profile, id: string, collectorId: string) {
    const data = this.read(),
      r = this.job(data, actor, id);
    if (actor.role !== 'admin') throw new Error('Not authorized');
    if (!['Pending', 'Assigned'].includes(r.status))
      throw new Error('Invalid status transition: only pending or assigned jobs can be assigned');
    if (!data.profiles.some((p) => p.id === collectorId && p.role === 'collector'))
      throw new Error('Choose an authorized collector');
    const previous = activeAssignment(data, id);
    if (previous) previous.status = 'replaced';
    data.assignments.push({
      id: crypto.randomUUID(),
      request_id: id,
      collector_id: collectorId,
      assigned_by: actor.id,
      assigned_at: new Date().toISOString(),
      status: 'active',
    });
    if (r.status === 'Pending') this.transition(data, r, actor, 'Assigned');
    this.save(data);
  }
  async start(actor: Profile, id: string) {
    const data = this.read(),
      r = this.job(data, actor, id);
    if (actor.role !== 'collector' || activeAssignment(data, id)?.collector_id !== actor.id)
      throw new Error('Not authorized');
    this.transition(data, r, actor, 'In Progress');
    this.save(data);
  }
  async complete(actor: Profile, id: string, input: CollectionInput, proof?: File) {
    const parsed = collectionSchema.parse(input),
      proof_image_path = proof ? await dataUrl(proof) : null;
    const data = this.read(),
      r = this.job(data, actor, id),
      assignment = activeAssignment(data, id);
    if (actor.role !== 'collector' || assignment?.collector_id !== actor.id)
      throw new Error('Not authorized');
    validateDestination(r.waste_category, parsed);
    this.transition(data, r, actor, 'Collected');
    data.collections.push({
      id: crypto.randomUUID(),
      request_id: id,
      collector_id: actor.id,
      collected_at: r.updated_at,
      proof_image_path,
      notes: parsed.notes,
      destination_type: parsed.destination_type,
      destination_name: parsed.destination_name,
      destination_status: parsed.destination_status,
    });
    assignment.status = 'completed';
    this.save(data);
  }
  async close(actor: Profile, id: string, status: 'Cancelled' | 'Rejected', reason: string) {
    const data = this.read(),
      r = this.job(data, actor, id);
    if (!(
      actor.role === 'admin' ||
      (actor.role === 'resident' && status === 'Cancelled' && r.status === 'Pending')
    ))
      throw new Error('Not authorized');
    if (reason.trim().length < 5 || reason.length > 500)
      throw new Error('Provide a reason (5–500 characters)');
    this.transition(data, r, actor, status, reason.trim());
    const assignment = activeAssignment(data, id);
    if (assignment) assignment.status = 'cancelled';
    this.save(data);
  }
  async updateProfile(actor: Profile, input: Pick<Profile, 'name' | 'phone' | 'ward'>) {
    const parsed = profileSchema.parse(input),
      data = this.read(),
      stored = this.actor(data, actor);
    Object.assign(stored, parsed);
    this.save(data);
    return stored;
  }
  async imageUrl(path: string) {
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(path)) throw new Error('Invalid demo image');
    return path;
  }
  reset() {
    this.save(createSeed());
  }
}
