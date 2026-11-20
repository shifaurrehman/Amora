jest.mock('../src/lib/supabase', () => ({ supabase: {} }));
jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(async () => 'aGVsbG8='),
  },
}));

import { supabase } from '../src/lib/supabase';
import {
  ProfileJoinRow,
  fetchFilteredProfiles,
  fetchOwnProfile,
  fetchVisibleProfiles,
  mapProfileRowsToUsers,
  saveProfile,
} from '../src/services/supabase/profiles';
import { createMockClient, createMockStorage } from './helpers/supabaseMock';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ID = '22222222-2222-2222-2222-222222222222';

const profileRow = (overrides: Partial<ProfileJoinRow> = {}): ProfileJoinRow => ({
  user_id: USER_ID,
  name: 'Ayesha',
  age_years: 28,
  gender: 'Female',
  profession: 'Doctor',
  education: "Master's Degree",
  height: '165',
  weight: '55',
  hobbies: 'reading, travel',
  religion: 'Islam',
  sect: 'Sunni',
  city: 'Karachi',
  about: 'Hello',
  employment_status: 'Employed',
  marital_status: 'Single',
  is_discoverable: true,
  created_at: '2026-11-20T10:00:00Z',
  updated_at: '2026-11-20T10:00:00Z',
  profile_languages: [{ language_id: 1, languages: { id: 1, name: 'Urdu' } }],
  profile_media: [
    { id: 'm1', user_id: USER_ID, object_path: `${USER_ID}/avatar-0.jpg`, kind: 'avatar', position: 0, mime_type: 'image/jpeg', file_name: 'me.jpg' },
    { id: 'm2', user_id: USER_ID, object_path: `${USER_ID}/gallery-2.jpg`, kind: 'gallery', position: 2, mime_type: 'image/jpeg', file_name: 'b.jpg' },
    { id: 'm3', user_id: USER_ID, object_path: `${USER_ID}/gallery-1.jpg`, kind: 'gallery', position: 1, mime_type: 'image/jpeg', file_name: 'a.jpg' },
  ],
  ...overrides,
});

const installStorageUrls = () => {
  const storage = createMockStorage();
  (storage.__bucket.createSignedUrls as jest.Mock).mockImplementation(async (paths: string[]) => ({
    data: paths.map((path: string) => ({ path, signedUrl: `https://signed/${path}` })),
    error: null,
  }));
  return storage;
};

describe('mapProfileRowsToUsers', () => {
  it('maps schema rows to the UI profile shape with signed media urls', async () => {
    Object.assign(supabase, createMockClient({ storage: installStorageUrls() }).client);

    const [mapped] = await mapProfileRowsToUsers([profileRow()]);

    expect(mapped).toMatchObject({
      id: USER_ID,
      userId: USER_ID,
      name: 'Ayesha',
      age: '28',
      gender: 'Female',
      profession: 'Doctor',
      education: "Master's Degree",
      height: '165',
      weight: '55',
      religion: 'Islam',
      sect: 'Sunni',
      city: 'Karachi',
      about: 'Hello',
      employmentStatus: 'Employed',
      maritalStatus: 'Single',
      profileImage: { uri: `https://signed/${USER_ID}/avatar-0.jpg` },
    });
    expect(mapped.languages).toEqual([{ id: 1, name: 'Urdu' }]);
    // Gallery images keep their position order regardless of row order.
    expect(mapped.extraimages).toEqual([
      { uri: `https://signed/${USER_ID}/gallery-1.jpg` },
      { uri: `https://signed/${USER_ID}/gallery-2.jpg` },
    ]);
  });

  it('omits media without a signed url', async () => {
    const storage = createMockStorage();
    (storage.__bucket.createSignedUrls as jest.Mock).mockResolvedValue({ data: [], error: null });
    Object.assign(supabase, createMockClient({ storage }).client);

    const [mapped] = await mapProfileRowsToUsers([profileRow()]);
    expect(mapped.profileImage).toBeUndefined();
    expect(mapped.extraimages).toEqual([]);
  });
});

describe('fetchVisibleProfiles', () => {
  it('returns mapped profiles and can exclude the caller', async () => {
    const dedicated = createMockClient({
      tables: { profiles: { data: [profileRow()], error: null } },
      storage: installStorageUrls(),
    });
    Object.assign(supabase, dedicated.client);

    const profiles = await fetchVisibleProfiles({ excludeUserId: OTHER_ID });

    expect(dedicated.tables.profiles.neq).toHaveBeenCalledWith('user_id', OTHER_ID);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].id).toBe(USER_ID);
  });

  it('throws query errors', async () => {
    Object.assign(
      supabase,
      createMockClient({ tables: { profiles: { data: null, error: new Error('rls denied') } } }).client,
    );
    await expect(fetchVisibleProfiles()).rejects.toThrow('rls denied');
  });
});

describe('fetchFilteredProfiles', () => {
  it('applies age, gender, and religion filters server-side', async () => {
    const dedicated = createMockClient({
      tables: { profiles: { data: [], error: null } },
      storage: installStorageUrls(),
    });
    Object.assign(supabase, dedicated.client);

    await fetchFilteredProfiles([25, 35], 'Islam', 'Female');

    const query = dedicated.tables.profiles;
    expect(query.eq).toHaveBeenCalledWith('gender', 'Female');
    expect(query.eq).toHaveBeenCalledWith('religion', 'Islam');
    expect(query.gte).toHaveBeenCalledWith('age_years', 25);
    expect(query.lte).toHaveBeenCalledWith('age_years', 35);
  });

  it('skips filters that are not provided', async () => {
    const dedicated = createMockClient({
      tables: { profiles: { data: [], error: null } },
      storage: installStorageUrls(),
    });
    Object.assign(supabase, dedicated.client);

    await fetchFilteredProfiles(null, '', '');

    expect(dedicated.tables.profiles.eq).not.toHaveBeenCalled();
    expect(dedicated.tables.profiles.gte).not.toHaveBeenCalled();
  });
});

describe('fetchOwnProfile', () => {
  it('queries by user id and maps the single row', async () => {
    const dedicated = createMockClient({
      tables: { profiles: { data: profileRow(), error: null } },
      storage: installStorageUrls(),
    });
    Object.assign(supabase, dedicated.client);

    const profile = await fetchOwnProfile(USER_ID);

    expect(dedicated.tables.profiles.eq).toHaveBeenCalledWith('user_id', USER_ID);
    expect(profile?.id).toBe(USER_ID);
    expect(profile?.profileImage?.uri).toContain('https://signed/');
  });

  it('returns null when the profile does not exist', async () => {
    Object.assign(
      supabase,
      createMockClient({ tables: { profiles: { data: null, error: null } } }).client,
    );
    await expect(fetchOwnProfile(USER_ID)).resolves.toBeNull();
  });
});

const draft = {
  name: 'Ayesha',
  age: '28',
  gender: 'Female',
  profession: 'Doctor',
  education: "Master's Degree",
  height: '165',
  weight: '55',
  hobbies: 'reading, travel',
  religion: 'Islam',
  sect: 'Sunni',
  city: 'Karachi',
  about: 'Hello',
  employmentStatus: 'Employed',
  maritalStatus: 'Single',
  dateOfBirth: '1998-01-31',
  languageIds: [1, 12],
  profileImage: { uri: 'file://avatar.jpg', type: 'image/jpeg', fileName: 'avatar.jpg' },
  extraImages: [{ uri: 'file://extra1.png', type: 'image/png', fileName: 'extra1.png' }],
};

describe('saveProfile', () => {
  it('creates every row in schema order and uploads media after its row', async () => {
    const storage = createMockStorage();
    const dedicated = createMockClient({
      tables: {
        // profiles: maybeSingle(miss) -> insert
        profiles: [{ data: null, error: null }, { data: null, error: null }],
        profile_private: { data: null, error: null },
        // profile_languages: delete -> insert
        profile_languages: [{ data: null, error: null }, { data: null, error: null }],
        // profile_media: select -> avatar insert -> gallery insert
        profile_media: [
          { data: [], error: null },
          { data: null, error: null },
          { data: null, error: null },
        ],
      },
      storage,
    });
    Object.assign(supabase, dedicated.client);

    await saveProfile(USER_ID, draft);

    const profiles = dedicated.tables.profiles;
    expect(profiles.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        name: 'Ayesha',
        age_years: 28,
        employment_status: 'Employed',
        marital_status: 'Single',
        sect: 'Sunni',
      }),
    );
    expect(dedicated.tables.profile_private.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      date_of_birth: '1998-01-31',
    });
    expect(dedicated.tables.profile_languages.delete).toHaveBeenCalledWith();
    expect(dedicated.tables.profile_languages.insert).toHaveBeenCalledWith([
      { user_id: USER_ID, language_id: 1 },
      { user_id: USER_ID, language_id: 12 },
    ]);

    // Avatar + gallery rows exist before their storage uploads.
    expect(dedicated.tables.profile_media.insert).toHaveBeenCalledTimes(2);
    expect(storage.__bucket.upload).toHaveBeenCalledTimes(2);
    expect(storage.__bucket.upload).toHaveBeenCalledWith(
      `${USER_ID}/avatar-0.jpg`,
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'image/jpeg' }),
    );
    expect(storage.__bucket.upload).toHaveBeenCalledWith(
      `${USER_ID}/gallery-1.png`,
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'image/png' }),
    );
  });

  it('updates an existing profile instead of inserting', async () => {
    const storage = createMockStorage();
    const dedicated = createMockClient({
      tables: {
        // profiles: maybeSingle(hit) -> update
        profiles: [{ data: { user_id: USER_ID }, error: null }, { data: null, error: null }],
        profile_private: [{ data: null, error: { code: '23505', message: 'duplicate' } }, { data: null, error: null }],
        profile_languages: [{ data: null, error: null }, { data: null, error: null }],
        // existing media rows are fetched, rows+objects deleted, then re-uploaded
        profile_media: [
          { data: [{ user_id: USER_ID, object_path: `${USER_ID}/avatar-0.jpg`, kind: 'avatar', position: 0, mime_type: 'image/jpeg', file_name: 'old.jpg' }], error: null },
          { data: null, error: null }, // storage-independent row delete
          { data: null, error: null }, // avatar insert
          { data: null, error: null }, // gallery insert
        ],
      },
      storage,
    });
    Object.assign(supabase, dedicated.client);

    await saveProfile(USER_ID, draft);

    expect(dedicated.tables.profiles.update).toHaveBeenCalled();
    expect(dedicated.tables.profiles.insert).not.toHaveBeenCalled();
    expect(dedicated.tables.profile_private.update).toHaveBeenCalledWith({
      date_of_birth: '1998-01-31',
    });
    expect(storage.__bucket.remove).toHaveBeenCalledWith([`${USER_ID}/avatar-0.jpg`]);
  });

  it('caps gallery uploads at three images', async () => {
    const storage = createMockStorage();
    const dedicated = createMockClient({
      tables: {
        profiles: [{ data: null, error: null }, { data: null, error: null }],
        profile_private: { data: null, error: null },
        profile_languages: [{ data: null, error: null }, { data: null, error: null }],
        profile_media: [{ data: [], error: null }],
      },
      storage,
    });
    Object.assign(supabase, dedicated.client);

    await saveProfile(USER_ID, {
      ...draft,
      profileImage: null,
      extraImages: [
        { uri: 'file://1.jpg', type: 'image/jpeg', fileName: '1.jpg' },
        { uri: 'file://2.jpg', type: 'image/jpeg', fileName: '2.jpg' },
        { uri: 'file://3.jpg', type: 'image/jpeg', fileName: '3.jpg' },
        { uri: 'file://4.jpg', type: 'image/jpeg', fileName: '4.jpg' },
      ],
    });

    expect(storage.__bucket.upload).toHaveBeenCalledTimes(3);
    expect(storage.__bucket.remove).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric age before any query', async () => {
    const dedicated = createMockClient();
    Object.assign(supabase, dedicated.client);

    await expect(saveProfile(USER_ID, { ...draft, age: 'abc' })).rejects.toThrow('Age must be a number.');
    expect(dedicated.client.from).not.toHaveBeenCalled();
  });
});
