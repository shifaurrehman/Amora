import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfileType } from '../navigation/TypescriptTypes/UserType';

interface FilterState {
  profiles: UserProfileType[];
  loading: boolean;
  error: string | null;
}

const initialState: FilterState = {
  profiles: [],
  loading: false,
  error: null,
};

const filtersSlice = createSlice({
  name: 'filteredUsers',
  initialState,
  reducers: {
    fetchUsersRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action: PayloadAction<UserProfileType[]>) => {
      state.profiles = action.payload || [];
      state.loading = false;
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilteredProfiles: (state, action: PayloadAction<any[]>) => {
      state.profiles = action.payload;
    },
    clearFilteredProfiles: (state) => {
      state.profiles = [];
    },
  },
});

export const { setFilteredProfiles, clearFilteredProfiles, fetchUsersFailure, fetchUsersRequest, fetchUsersSuccess } = filtersSlice.actions;
export default filtersSlice.reducer;
