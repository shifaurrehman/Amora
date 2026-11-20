import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfileType } from '../navigation/TypescriptTypes/UserType';

export interface FavoritesState {
  favorites: UserProfileType[];
  loading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  favorites: [],
  loading: false,
  error: null,
};

export const favoriteKeyOf = (user: UserProfileType): string | undefined =>
  user.id ?? user.userId;

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    favoritesLoading(state) {
      state.loading = true;
      state.error = null;
    },
    favoritesLoaded(state, action: PayloadAction<UserProfileType[]>) {
      state.favorites = action.payload || [];
      state.loading = false;
    },
    favoritesLoadFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    favoriteAdded(state, action: PayloadAction<UserProfileType>) {
      const key = favoriteKeyOf(action.payload);
      if (key && !state.favorites.some((user) => favoriteKeyOf(user) === key)) {
        state.favorites.push(action.payload);
      }
    },
    favoriteRemoved(state, action: PayloadAction<string>) {
      state.favorites = state.favorites.filter(
        (user) => favoriteKeyOf(user) !== action.payload,
      );
    },
    favoritesError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
});

export const {
  favoritesLoading,
  favoritesLoaded,
  favoritesLoadFailed,
  favoriteAdded,
  favoriteRemoved,
  favoritesError,
} = favoriteSlice.actions;

export const selectFavoriteKeys = (state: { favorites: FavoritesState }): string[] =>
  state.favorites.favorites
    .map(favoriteKeyOf)
    .filter((key): key is string => Boolean(key));

export default favoriteSlice.reducer;
