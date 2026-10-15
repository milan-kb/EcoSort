import { z } from 'zod';
import { collectionSchema, profileSchema, requestSchema } from './domain';
import { roles, statuses } from '../types/domain';

const id = z.uuid();
const timestamp = z.iso.datetime();
// Stored demo data is browser-editable. Reject malformed records before they
// reach dates, status badges or relationship lookups; never silently reset it.
export const snapshotSchema = z.object({
  profiles: z.array(
    profileSchema.extend({ id, auth_user_id: id, role: z.enum(roles), created_at: timestamp }),
  ),
  requests: z.array(
    requestSchema.safeExtend({
      id,
      resident_id: id,
      status: z.enum(statuses),
      image_path: z.string().nullable(),
      created_at: timestamp,
      updated_at: timestamp,
    }),
  ),
  assignments: z.array(
    z.object({
      id,
      request_id: id,
      collector_id: id,
      assigned_by: id,
      assigned_at: timestamp,
      status: z.enum(['active', 'completed', 'replaced', 'cancelled']),
    }),
  ),
  collections: z.array(
    collectionSchema.omit({ confirmed: true }).extend({
      id,
      request_id: id,
      collector_id: id,
      collected_at: timestamp,
      proof_image_path: z.string().nullable(),
    }),
  ),
  history: z.array(
    z.object({
      id,
      request_id: id,
      previous_status: z.enum(statuses).nullable(),
      new_status: z.enum(statuses),
      changed_by: id.nullable(),
      changed_at: timestamp,
      reason: z.string().nullable(),
    }),
  ),
});
