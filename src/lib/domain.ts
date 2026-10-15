import { z } from 'zod';
import {
  categories,
  type CollectionInput,
  type Profile,
  type Snapshot,
  type Status,
  type WasteRequest,
} from '../types/domain';

export const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'];
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number')
    .refine((value) => value.replace(/\D/g, '').length >= 7, 'Enter at least 7 phone digits'),
  ward: z.string().trim().min(1, 'Choose a ward').max(40),
});
export const requestSchema = z
  .object({
    request_type: z.enum(['pickup', 'dumping']),
    waste_category: z.enum(categories),
    quantity: z.string().trim().max(100),
    ward: z.string().trim().min(1, 'Choose a ward').max(40),
    address: z.string().trim().min(5, 'Enter a location with at least 5 characters').max(300),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    description: z.string().trim().max(2000),
    preferred_date: z.iso.date().nullable(),
    is_segregated: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if ((v.latitude === null) !== (v.longitude === null))
      ctx.addIssue({
        code: 'custom',
        path: ['latitude'],
        message: 'Both coordinates are required',
      });
    if (v.request_type === 'pickup') {
      if (!v.quantity)
        ctx.addIssue({
          code: 'custom',
          path: ['quantity'],
          message: 'Enter an approximate quantity',
        });
      if (!v.is_segregated)
        ctx.addIssue({
          code: 'custom',
          path: ['is_segregated'],
          message: 'Please segregate waste and confirm before requesting pickup',
        });
      if (['Mixed', 'Unknown'].includes(v.waste_category))
        ctx.addIssue({
          code: 'custom',
          path: ['waste_category'],
          message: 'Choose a segregated waste category',
        });
    } else if (v.description.length < 10)
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'Describe the dumping site (at least 10 characters)',
      });
  });
export const collectionSchema = z.object({
  notes: z.string().trim().max(2000),
  destination_type: z.enum(['composting', 'sorting', 'authorized_hazardous', 'other']),
  destination_name: z.string().trim().min(3, 'Enter the destination name').max(200),
  destination_status: z.enum(['intended', 'handed_over']),
  confirmed: z.boolean().refine(Boolean, 'Confirm that the waste was physically collected'),
});
export const transitions: Record<Status, Status[]> = {
  Pending: ['Assigned', 'Cancelled', 'Rejected'],
  Assigned: ['In Progress', 'Cancelled', 'Rejected'],
  'In Progress': ['Collected', 'Rejected'],
  Collected: [],
  Cancelled: [],
  Rejected: [],
};
export function assertTransition(from: Status, to: Status) {
  if (!transitions[from].includes(to))
    throw new Error(`Invalid status transition: ${from} → ${to}`);
}
export function activeAssignment(data: Snapshot, id: string) {
  return data.assignments.find((a) => a.request_id === id && a.status === 'active');
}
export function canRead(actor: Profile, r: WasteRequest, data: Snapshot) {
  return (
    actor.role === 'admin' ||
    (actor.role === 'resident' && r.resident_id === actor.id) ||
    (actor.role === 'collector' &&
      data.assignments.some(
        (a) =>
          a.request_id === r.id &&
          a.collector_id === actor.id &&
          ['active', 'completed'].includes(a.status),
      ))
  );
}
export function validateDestination(category: string, input: CollectionInput) {
  if (category === 'E-waste & hazardous' && input.destination_type !== 'authorized_hazardous')
    throw new Error('Hazardous waste requires an authorized handling destination');
}
export function statistics(requests: WasteRequest[]) {
  const valid = requests.filter((r) => !['Cancelled', 'Rejected'].includes(r.status));
  const collected = valid.filter((r) => r.status === 'Collected').length;
  return {
    total: requests.length,
    pending: valid.filter((r) => r.status === 'Pending').length,
    active: valid.filter((r) => ['Assigned', 'In Progress'].includes(r.status)).length,
    collected,
    unassigned: valid.filter((r) => r.status === 'Pending').length,
    rate: valid.length ? Math.round((collected / valid.length) * 100) : 0,
    segregated: requests.filter((r) => r.request_type === 'pickup' && r.is_segregated).length,
  };
}
export function shortId(id: string) {
  return `ECO-${id.slice(0, 8).toUpperCase()}`;
}
export function dateLabel(value: string | null, time = false) {
  return value
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(time ? { hour: 'numeric', minute: '2-digit' } : {}),
      }).format(new Date(value))
    : 'Not specified';
}
export function isOverdue(r: WasteRequest) {
  return (
    !['Collected', 'Cancelled', 'Rejected'].includes(r.status) &&
    (r.preferred_date
      ? r.preferred_date < new Date().toISOString().slice(0, 10)
      : Date.now() - Date.parse(r.created_at) > 7 * 86400000)
  );
}
export function validCoordinates(lat: number | null, lng: number | null): boolean {
  return (
    lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}
