import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { collectionSchema, profileSchema, requestSchema } from '../lib/domain';
import { validateImage } from '../lib/images';
import type { CollectionInput, Profile, Repository, RequestInput, Snapshot } from '../types/domain';
export const isDemo = import.meta.env.VITE_APP_MODE !== 'connected';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// A browser-only SPA cannot set HttpOnly cookies. Keep connected auth in memory,
// never persist access/refresh tokens to localStorage. Reload requires sign-in.
export const supabase =
  !isDemo && url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
export class SupabaseRepository implements Repository {
  constructor(private client: SupabaseClient) {}
  private async rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await this.client.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  }
  async load(): Promise<Snapshot> {
    // ponytail: a small-pilot snapshot; use paginated queries and server aggregates
    // when data volume makes loading the complete authorized workspace expensive.
    // A single JSON RPC avoids PostgREST's default 1,000-row response truncation.
    return (await this.rpc('workspace_snapshot', {})) as Snapshot;
  }
  private async upload(actor: Profile, requestId: string, file?: File): Promise<string | null> {
    if (!file) return null;
    await validateImage(file);
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${actor.auth_user_id}/${requestId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await this.client.storage
      .from('waste-images')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return path;
  }
  private async discard(path: string | null) {
    if (path) await this.client.storage.from('waste-images').remove([path]);
  }
  async create(actor: Profile, input: RequestInput, image?: File) {
    const parsed = requestSchema.parse(input),
      id = crypto.randomUUID();
    const image_path = await this.upload(actor, id, image);
    try {
      await this.rpc('create_request', { p_id: id, p_payload: { ...parsed, image_path } });
      return id;
    } catch (e) {
      await this.discard(image_path);
      throw e;
    }
  }
  async assign(_actor: Profile, requestId: string, collectorId: string) {
    await this.rpc('assign_request', { p_request: requestId, p_collector: collectorId });
  }
  async start(_actor: Profile, requestId: string) {
    await this.rpc('start_collection', { p_request: requestId });
  }
  async complete(actor: Profile, requestId: string, input: CollectionInput, proof?: File) {
    const parsed = collectionSchema.parse(input),
      proof_image_path = await this.upload(actor, requestId, proof);
    try {
      await this.rpc('complete_collection', {
        p_request: requestId,
        p_payload: { ...parsed, proof_image_path },
      });
    } catch (e) {
      await this.discard(proof_image_path);
      throw e;
    }
  }
  async close(
    _actor: Profile,
    requestId: string,
    status: 'Cancelled' | 'Rejected',
    reason: string,
  ) {
    await this.rpc('close_request', { p_request: requestId, p_status: status, p_reason: reason });
  }
  async updateProfile(_actor: Profile, input: Pick<Profile, 'name' | 'phone' | 'ward'>) {
    const parsed = profileSchema.parse(input);
    return (await this.rpc('update_my_profile', {
      p_name: parsed.name,
      p_phone: parsed.phone,
      p_ward: parsed.ward,
    })) as Profile;
  }
  async imageUrl(path: string) {
    const { data, error } = await this.client.storage
      .from('waste-images')
      .createSignedUrl(path, 300);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  }
}
