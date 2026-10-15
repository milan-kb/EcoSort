export const roles = ['resident', 'collector', 'admin'] as const;
export type Role = (typeof roles)[number];
export const categories = [
  'Organic',
  'Plastic',
  'Paper & cardboard',
  'Glass',
  'Metal',
  'E-waste & hazardous',
  'Mixed',
  'Unknown',
] as const;
export type Category = (typeof categories)[number];
export const statuses = [
  'Pending',
  'Assigned',
  'In Progress',
  'Collected',
  'Cancelled',
  'Rejected',
] as const;
export type Status = (typeof statuses)[number];
export interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  phone: string;
  ward: string;
  role: Role;
  created_at: string;
}
export interface WasteRequest {
  id: string;
  resident_id: string;
  request_type: 'pickup' | 'dumping';
  waste_category: Category;
  quantity: string;
  ward: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  image_path: string | null;
  preferred_date: string | null;
  is_segregated: boolean;
  status: Status;
  created_at: string;
  updated_at: string;
}
export type RequestInput = Omit<
  WasteRequest,
  'id' | 'resident_id' | 'status' | 'created_at' | 'updated_at' | 'image_path'
>;
export interface Assignment {
  id: string;
  request_id: string;
  collector_id: string;
  assigned_by: string;
  assigned_at: string;
  status: 'active' | 'completed' | 'replaced' | 'cancelled';
}
export interface Collection {
  id: string;
  request_id: string;
  collector_id: string;
  collected_at: string;
  proof_image_path: string | null;
  notes: string;
  destination_type: 'composting' | 'sorting' | 'authorized_hazardous' | 'other';
  destination_name: string;
  destination_status: 'intended' | 'handed_over';
}
export type CollectionInput = Pick<
  Collection,
  'notes' | 'destination_type' | 'destination_name' | 'destination_status'
> & { confirmed: boolean };
export interface History {
  id: string;
  request_id: string;
  previous_status: Status | null;
  new_status: Status;
  changed_by: string;
  changed_at: string;
  reason: string | null;
}
export interface Snapshot {
  profiles: Profile[];
  requests: WasteRequest[];
  assignments: Assignment[];
  collections: Collection[];
  history: History[];
}
export interface Repository {
  load(actor: Profile): Promise<Snapshot>;
  create(actor: Profile, input: RequestInput, image?: File): Promise<string>;
  assign(actor: Profile, requestId: string, collectorId: string): Promise<void>;
  start(actor: Profile, requestId: string): Promise<void>;
  complete(actor: Profile, requestId: string, input: CollectionInput, proof?: File): Promise<void>;
  close(
    actor: Profile,
    requestId: string,
    status: 'Cancelled' | 'Rejected',
    reason: string,
  ): Promise<void>;
  updateProfile(actor: Profile, input: Pick<Profile, 'name' | 'phone' | 'ward'>): Promise<Profile>;
  imageUrl(path: string): Promise<string>;
}
