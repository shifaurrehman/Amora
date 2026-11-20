import { Alert } from 'react-native';
import { UserProfileType } from '../navigation/TypescriptTypes/UserType';
import {
  addFavorite,
  fetchFavoriteProfiles,
  removeFavorite,
} from '../services/supabase/favorites';
import { getCurrentUserId } from '../services/supabase/session';
import { AppDispatch, RootState } from './store';
import {
  favoriteAdded,
  favoriteKeyOf,
  favoriteRemoved,
  favoritesError,
  favoritesLoadFailed,
  favoritesLoaded,
  favoritesLoading,
} from './favoriteSlice';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

/** Loads the signed-in user's favorites from Supabase into the store. */
export const loadFavorites = () => async (dispatch: AppDispatch) => {
  dispatch(favoritesLoading());
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      dispatch(favoritesLoaded([]));
      return;
    }
    const favorites = await fetchFavoriteProfiles(userId);
    dispatch(favoritesLoaded(favorites));
  } catch (error: unknown) {
    dispatch(favoritesLoadFailed(errorMessage(error)));
  }
};

/**
 * Toggles a favorite optimistically and syncs with Supabase. If the request
 * fails, the local change is reverted so the heart icon reflects the server.
 */
export const toggleFavorite =
  (user: UserProfileType) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const key = favoriteKeyOf(user);
    if (!key) {
      return;
    }
    const wasFavorite = getState().favorites.favorites.some(
      (favorite) => favoriteKeyOf(favorite) === key,
    );

    dispatch(wasFavorite ? favoriteRemoved(key) : favoriteAdded(user));
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('You must be signed in to save favorites.');
      }
      if (wasFavorite) {
        await removeFavorite(userId, key);
      } else {
        await addFavorite(userId, key);
      }
    } catch (error: unknown) {
      dispatch(wasFavorite ? favoriteAdded(user) : favoriteRemoved(key));
      dispatch(favoritesError(errorMessage(error)));
      Alert.alert(
        'Favorite not saved',
        error instanceof Error ? error.message : 'Could not update favorites. Please try again.',
      );
    }
  };
