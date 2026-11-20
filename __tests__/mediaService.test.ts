jest.mock('../src/lib/supabase', () => ({ supabase: {} }));
jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(async () => 'aGVsbG8='), // "hello"
  },
}));

import { supabase } from '../src/lib/supabase';
import {
  MAX_IMAGE_BYTES,
  buildMediaRow,
  buildObjectPath,
  createSignedUrlMap,
  deleteProfileMedia,
  normalizeImageMime,
  uploadProfileMedia,
  validatePickedImage,
} from '../src/services/supabase/media';
import { createMockClient, createMockStorage } from './helpers/supabaseMock';

const USER_ID = '11111111-1111-1111-1111-111111111111';

describe('normalizeImageMime', () => {
  it('normalizes image/jpg to image/jpeg', () => {
    expect(normalizeImageMime('image/jpg')).toBe('image/jpeg');
    expect(normalizeImageMime('IMAGE/JPEG')).toBe('image/jpeg');
  });

  it('accepts the bucket mime types', () => {
    expect(normalizeImageMime('image/jpeg')).toBe('image/jpeg');
    expect(normalizeImageMime('image/png')).toBe('image/png');
    expect(normalizeImageMime('image/webp')).toBe('image/webp');
  });

  it('rejects unsupported or missing types', () => {
    expect(normalizeImageMime('image/gif')).toBeNull();
    expect(normalizeImageMime(undefined)).toBeNull();
  });
});

describe('validatePickedImage', () => {
  it('accepts a small jpeg', () => {
    expect(
      validatePickedImage({ uri: 'file://a.jpg', type: 'image/jpeg', fileName: 'a.jpg', fileSize: 1024 }),
    ).toEqual({ valid: true });
  });

  it('rejects unsupported types with a helpful message', () => {
    const result = validatePickedImage({ uri: 'file://a.gif', type: 'image/gif', fileName: 'a.gif' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('JPEG, PNG, or WebP');
  });

  it('rejects images larger than the bucket limit', () => {
    const result = validatePickedImage({
      uri: 'file://big.jpg',
      type: 'image/jpeg',
      fileName: 'big.jpg',
      fileSize: MAX_IMAGE_BYTES + 1,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 MiB');
  });

  it('allows unknown sizes (bucket enforces the limit server-side)', () => {
    expect(
      validatePickedImage({ uri: 'file://a.jpg', type: 'image/jpeg', fileName: 'a.jpg' }).valid,
    ).toBe(true);
  });
});

describe('buildObjectPath / buildMediaRow', () => {
  it('prefixes object paths with the owner user id and stable names', () => {
    expect(buildObjectPath(USER_ID, 'avatar', 0, 'image/jpeg')).toBe(`${USER_ID}/avatar-0.jpg`);
    expect(buildObjectPath(USER_ID, 'gallery', 2, 'image/webp')).toBe(`${USER_ID}/gallery-2.webp`);
  });

  it('builds a row matching the profile_media schema', () => {
    const row = buildMediaRow(
      USER_ID,
      { uri: 'file://a.jpg', type: 'image/jpg', fileName: 'a.jpg' },
      'gallery',
      1,
    );
    expect(row).toMatchObject({
      user_id: USER_ID,
      bucket_id: 'profile-media',
      object_path: `${USER_ID}/gallery-1.jpg`,
      kind: 'gallery',
      position: 1,
      mime_type: 'image/jpeg',
      file_name: 'a.jpg',
    });
  });
});

describe('uploadProfileMedia', () => {
  it('inserts the profile_media row before uploading the object', async () => {
    const storage = createMockStorage();
    const dedicated = createMockClient({
      tables: { profile_media: { data: null, error: null } },
      storage,
    });
    Object.assign(supabase, dedicated.client);

    const row = buildMediaRow(USER_ID, { uri: 'file://a.png', type: 'image/png', fileName: 'a.png' }, 'avatar', 0);
    const callOrder: string[] = [];
    dedicated.tables.profile_media.insert.mockImplementation(() => {
      callOrder.push('row-insert');
      return dedicated.tables.profile_media;
    });
    (storage.__bucket.upload as jest.Mock).mockImplementation(async () => {
      callOrder.push('storage-upload');
      return { data: { path: row.object_path }, error: null };
    });

    await uploadProfileMedia(row, { uri: 'file://a.png', type: 'image/png', fileName: 'a.png' });

    expect(callOrder).toEqual(['row-insert', 'storage-upload']);
    expect(dedicated.tables.profile_media.insert).toHaveBeenCalledWith(
      expect.objectContaining({ object_path: row.object_path, kind: 'avatar', position: 0 }),
    );
    expect(storage.__bucket.upload).toHaveBeenCalledWith(
      row.object_path,
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'image/png', upsert: false }),
    );
  });

  it('removes the reserved row when the upload fails', async () => {
    const storage = createMockStorage();
    (storage.__bucket.upload as jest.Mock).mockResolvedValue({ data: null, error: new Error('too large') });
    const dedicated = createMockClient({
      tables: { profile_media: [{ data: null, error: null }, { data: null, error: null }] },
      storage,
    });
    Object.assign(supabase, dedicated.client);

    const row = buildMediaRow(USER_ID, { uri: 'file://a.jpg', type: 'image/jpeg', fileName: 'a.jpg' }, 'avatar', 0);

    await expect(
      uploadProfileMedia(row, { uri: 'file://a.jpg', type: 'image/jpeg', fileName: 'a.jpg' }),
    ).rejects.toThrow('too large');

    expect(dedicated.tables.profile_media.delete).toHaveBeenCalled();
    expect(dedicated.tables.profile_media.eq).toHaveBeenCalledWith('object_path', row.object_path);
  });
});

describe('deleteProfileMedia', () => {
  it('removes storage objects and rows', async () => {
    const dedicated = createMockClient({
      tables: { profile_media: { data: null, error: null } },
    });
    Object.assign(supabase, dedicated.client);

    await deleteProfileMedia([
      { user_id: USER_ID, object_path: `${USER_ID}/avatar-0.jpg`, kind: 'avatar', position: 0, mime_type: 'image/jpeg', file_name: 'a.jpg' },
      { user_id: USER_ID, object_path: `${USER_ID}/gallery-1.jpg`, kind: 'gallery', position: 1, mime_type: 'image/jpeg', file_name: 'b.jpg' },
    ]);

    expect(dedicated.storage.__bucket.remove).toHaveBeenCalledWith([
      `${USER_ID}/avatar-0.jpg`,
      `${USER_ID}/gallery-1.jpg`,
    ]);
    expect(dedicated.tables.profile_media.delete).toHaveBeenCalled();
  });

  it('is a no-op without rows', async () => {
    const dedicated = createMockClient({ tables: { profile_media: { data: null, error: null } } });
    Object.assign(supabase, dedicated.client);
    await deleteProfileMedia([]);
    expect(dedicated.storage.__bucket.remove).not.toHaveBeenCalled();
    expect(dedicated.tables.profile_media.delete).not.toHaveBeenCalled();
  });
});

describe('createSignedUrlMap', () => {
  it('maps signed urls by object path and skips failed entries', async () => {
    const storage = createMockStorage();
    (storage.__bucket.createSignedUrls as jest.Mock).mockResolvedValue({
      data: [
        { path: 'u1/avatar-0.jpg', signedUrl: 'https://signed/u1-avatar' },
        { path: 'u1/gallery-1.jpg', error: 'not found' },
        { path: 'u1/gallery-2.jpg', signedUrl: 'https://signed/u1-gallery2' },
      ],
      error: null,
    });
    const dedicated = createMockClient({ storage });
    Object.assign(supabase, dedicated.client);

    const map = await createSignedUrlMap([
      'u1/avatar-0.jpg',
      'u1/gallery-1.jpg',
      'u1/gallery-2.jpg',
      'u1/avatar-0.jpg', // duplicate path
      '',
    ]);

    expect(map).toEqual({
      'u1/avatar-0.jpg': 'https://signed/u1-avatar',
      'u1/gallery-2.jpg': 'https://signed/u1-gallery2',
    });
    expect(storage.__bucket.createSignedUrls).toHaveBeenCalledWith(
      ['u1/avatar-0.jpg', 'u1/gallery-1.jpg', 'u1/gallery-2.jpg'],
      expect.any(Number),
    );
  });

  it('returns an empty map without paths', async () => {
    const dedicated = createMockClient();
    Object.assign(supabase, dedicated.client);
    await expect(createSignedUrlMap([])).resolves.toEqual({});
    expect(dedicated.storage.__bucket.createSignedUrls).not.toHaveBeenCalled();
  });

  it('propagates signing errors', async () => {
    const storage = createMockStorage();
    (storage.__bucket.createSignedUrls as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('signing failed'),
    });
    Object.assign(supabase, createMockClient({ storage }).client);

    await expect(createSignedUrlMap(['u1/avatar-0.jpg'])).rejects.toThrow('signing failed');
  });
});
