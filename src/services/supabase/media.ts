import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';

// Matches the private `profile-media` bucket configured in
// supabase/migrations/20261120142000_initial_schema.sql: private, 5 MiB limit,
// JPEG/PNG/WebP only, and object paths must start with the owning user id.
export const PROFILE_MEDIA_BUCKET = 'profile-media';
export const MAX_IMAGE_BYTES = 5242880;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ProfileMediaKind = 'avatar' | 'gallery';

export const AVATAR_POSITION = 0;
export const MIN_GALLERY_POSITION = 1;
export const MAX_GALLERY_POSITION = 3;

export interface PickedImage {
  uri: string;
  type: string;
  fileName: string;
  fileSize?: number;
}

export interface ProfileMediaRow {
  id?: string;
  user_id: string;
  bucket_id?: string;
  object_path: string;
  kind: ProfileMediaKind;
  position: number;
  mime_type: string;
  file_name: string;
}

/** Normalizes picker mime types to the exact values the bucket accepts. */
export function normalizeImageMime(type: string | undefined): string | null {
  if (!type) {
    return null;
  }
  const normalized = type.toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(normalized)
    ? normalized
    : null;
}

export interface ImageValidationResult {
  valid: boolean
  error?: string;
}

export function validatePickedImage(image: PickedImage): ImageValidationResult {
  const mime = normalizeImageMime(image.type);
  if (!mime) {
    return {
      valid: false,
      error: `Unsupported image type. Use JPEG, PNG, or WebP (got ${image.type || 'unknown'}).`,
    };
  }
  if (image.fileSize != null && image.fileSize > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: `Image is too large. The maximum size is ${MAX_IMAGE_BYTES / (1024 * 1024)} MiB.`,
    };
  }
  return { valid: true };
}

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Object paths must be `<user_id>/...` (see the storage RLS policies) and
 * unique, so they are derived from the owner id, media kind, and position.
 */
export function buildObjectPath(
  userId: string,
  kind: ProfileMediaKind,
  position: number,
  mimeType: string,
): string {
  const extension = MIME_EXTENSION[mimeType] || 'jpg';
  return `${userId}/${kind}-${position}.${extension}`;
}

async function readImageAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (!uri) {
    throw new Error('No image file to read.');
  }
  // Picker uris are file:// paths; read them as base64 and decode for upload.
  const base64 = await RNFS.readFile(decodeURIComponent(uri.replace(/^file:\/\//, '')), 'base64');
  return decode(base64);
}

export function buildMediaRow(
  userId: string,
  image: PickedImage,
  kind: ProfileMediaKind,
  position: number,
): ProfileMediaRow {
  const mimeType = normalizeImageMime(image.type);
  if (!mimeType) {
    throw new Error(`Unsupported image type: ${image.type || 'unknown'}`);
  }
  return {
    user_id: userId,
    bucket_id: PROFILE_MEDIA_BUCKET,
    object_path: buildObjectPath(userId, kind, position, mimeType),
    kind,
    position,
    mime_type: mimeType,
    file_name: image.fileName || `${kind}-${position}`,
  };
}

export function galleryPositionForIndex(index: number): number {
  return MIN_GALLERY_POSITION + index;
}

/**
 * Uploads one image to the private bucket.
 *
 * The storage insert policy requires a matching `profile_media` row to exist
 * before the object can be written, so the row is inserted first and removed
 * again when the upload fails.
 */
export async function uploadProfileMedia(
  row: ProfileMediaRow,
  image: PickedImage,
): Promise<ProfileMediaRow> {
  const { error: insertError } = await supabase
    .from('profile_media')
    .insert({ ...row, bucket_id: PROFILE_MEDIA_BUCKET });

  if (insertError) {
    throw insertError;
  }

  const fileBody = await readImageAsArrayBuffer(image.uri);
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(row.object_path, fileBody, { contentType: row.mime_type, upsert: false });

  if (uploadError) {
    // Best-effort cleanup so the failed object does not keep a reserved row.
    await supabase.from('profile_media').delete().eq('object_path', row.object_path);
    throw uploadError;
  }

  return row;
}

/** Removes the user's media rows and their storage objects (owner-only paths). */
export async function deleteProfileMedia(
  rows: ProfileMediaRow[],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }
  const paths = rows.map((row) => row.object_path);
  const { error: storageError } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .remove(paths);
  const { error: rowError } = await supabase
    .from('profile_media')
    .delete()
    .in('object_path', paths);

  // Report the first failure; the other operation is still attempted.
  if (storageError) {
    throw storageError;
  }
  if (rowError) {
    throw rowError;
  }
}

export type SignedUrlByPath = Record<string, string>;

/** Creates signed URLs for private bucket objects, skipping failed paths. */
export async function createSignedUrlMap(
  objectPaths: string[],
  expiresInSeconds = 3600,
): Promise<SignedUrlByPath> {
  const uniquePaths = Array.from(new Set(objectPaths.filter(Boolean)));
  if (uniquePaths.length === 0) {
    return {};
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .createSignedUrls(uniquePaths, expiresInSeconds);

  if (error) {
    throw error;
  }

  const urlByPath: SignedUrlByPath = {};
  (data || []).forEach((entry) => {
    if (entry?.path && entry.signedUrl && !entry.error) {
      urlByPath[entry.path] = entry.signedUrl;
    }
  });
  return urlByPath;
}
