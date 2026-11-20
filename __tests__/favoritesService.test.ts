jest.mock('../src/lib/supabase', () => ({ supabase: {} }));
jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn(async () => 'aGVsbG8='),
  },
}));

import { supabase } from '../src/lib/supabase';
import { addFavorite, fetchFavoriteProfiles, removeFavorite } from '../src/services/supabase/favorites';
import { createMockClient, createMockStorage } from './helpers/supabaseMock';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const FAVORITE_ID = '22222222-2222-2222-2222-222222222222';

const favoriteProfileRow = {
  user_id: FAVORITE_ID,
  name: 'Bilal',
  age_years: 30,
  gender: 'Male',
  profession: 'Teacher',
  education: 'Bachelor\'s Degree',
  height: '175',
  weight: '70',
  hobbies: 'cricket',
  religion: 'Islam',
  sect: '',
  city: 'Lahore',
  about: '',
  employment_status: 'Employed',
  marital_status: 'Single',
  is_discoverable: true,
  created_at: '2026-11-20T10:00:00Z',
  updated_at: '2026-11-20T10:00:00Z',
  profile_languages: [],
  profile_media: [
    { id: 'm1', user_id: FAVORITE_ID, object_path: `${FAVORITE_ID}/avatar-0.jpg`, kind: 'avatar', position: 0, mime_type: 'image/jpeg', file_name: 'b.jpg' },
  ],
};

const installStorageUrls = () => {
  const storage = createMockStorage();
  (storage.__bucket.createSignedUrls as jest.Mock).mockImplementation(async (paths: string[]) => ({
    data: paths.map((path: string) => ({ path, signedUrl: `https://signed/${path}` })),
    error: null,
  }));
  return storage;
};

describe('fetchFavoriteProfiles', () => {
  it('joins favorites with profiles and maps them for the UI', async () => {
    const dedicated = createMockClient({
      tables: {
        favorites: {
          data: [{ favorite_user_id: FAVORITE_ID, profiles: favoriteProfileRow }],
          error: null,
        },
      },
      storage: installStorageUrls(),
    });
    Object.assign(supabase, dedicated.client);

    const favorites = await fetchFavoriteProfiles(USER_ID);

    expect(dedicated.tables.favorites.eq).toHaveBeenCalledWith('user_id', USER_ID);
    expect(favorites).toHaveLength(1);
    expect(favorites[0]).toMatchObject({
      id: FAVORITE_ID,
      userId: FAVORITE_ID,
      name: 'Bilal',
      age: '30',
      profileImage: { uri: `https://signed/${FAVORITE_ID}/avatar-0.jpg` },
    });
  });

  it('tolerates the nested join returning an array of profiles', async () => {
    const dedicated = createMockClient({
      tables: {
        favorites: {
          data: [{ favorite_user_id: FAVORITE_ID, profiles: [favoriteProfileRow] }],
          error: null,
        },
      },
      storage: installStorageUrls(),
    });
    Object.assign(supabase, dedicated.client);

    const favorites = await fetchFavoriteProfiles(USER_ID);
    expect(favorites).toHaveLength(1);
    expect(favorites[0].id).toBe(FAVORITE_ID);
  });

  it('skips favorites whose profile is not readable and propagates errors', async () => {
    Object.assign(
      supabase,
      createMockClient({ tables: { favorites: { data: null, error: new Error('boom') } } }).client,
    );
    await expect(fetchFavoriteProfiles(USER_ID)).rejects.toThrow('boom');
  });
});

describe('addFavorite', () => {
  it('inserts the favorite pair for the caller', async () => {
    const dedicated = createMockClient({
      tables: { favorites: { data: null, error: null } },
    });
    Object.assign(supabase, dedicated.client);

    await addFavorite(USER_ID, FAVORITE_ID);

    expect(dedicated.tables.favorites.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      favorite_user_id: FAVORITE_ID,
    });
  });

  it('treats an existing favorite (unique violation) as success', async () => {
    const dedicated = createMockClient({
      tables: { favorites: { data: null, error: { code: '23505', message: 'duplicate' } } },
    });
    Object.assign(supabase, dedicated.client);

    await expect(addFavorite(USER_ID, FAVORITE_ID)).resolves.toBeUndefined();
  });

  it('propagates other errors', async () => {
    Object.assign(
      supabase,
      createMockClient({ tables: { favorites: { data: null, error: { code: '42501', message: 'rls' } } } }).client,
    );
    await expect(addFavorite(USER_ID, FAVORITE_ID)).rejects.toMatchObject({
      code: '42501',
      message: 'rls',
    });
  });
});

describe('removeFavorite', () => {
  it('deletes by caller and favorite ids', async () => {
    const dedicated = createMockClient({
      tables: { favorites: { data: null, error: null } },
    });
    Object.assign(supabase, dedicated.client);

    await removeFavorite(USER_ID, FAVORITE_ID);

    const eqCalls = dedicated.tables.favorites.eq.mock.calls;
    expect(eqCalls).toContainEqual(['user_id', USER_ID]);
    expect(eqCalls).toContainEqual(['favorite_user_id', FAVORITE_ID]);
  });

  it('propagates delete errors', async () => {
    Object.assign(
      supabase,
      createMockClient({ tables: { favorites: { data: null, error: new Error('nope') } } }).client,
    );
    await expect(removeFavorite(USER_ID, FAVORITE_ID)).rejects.toThrow('nope');
  });
});
