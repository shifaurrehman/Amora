import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../dummydata/Users'

interface ImageType {
    uri: string;
    type: string;
    fileName: string;
}

interface languageType {
    id: number;  // ✅ Change from string to number
    name: string;
}

interface FireBaseUsers {
    id: string,
    name: string,
    age: string;
    gender: string;
    profession: string;
    education: string;
    height: string;
    weight: string;
    languages: languageType[];
    hobbies: string;
    religion: string;
    sect: string;
    city: string;
    employmentStatus: string;
    maritalStatus: string;
    extraImages: ImageType[] | null;
    profileImage: ImageType | null;
    dateOfBirth: string | undefined;
}

interface favoriteState {
    favorites: FireBaseUsers[];
}

const initialState: favoriteState = {
    favorites: [],
}

const favoriteSlice = createSlice({
    name: "favorites",
    initialState,
    reducers: {
        addFavorites: (state, action: PayloadAction<FireBaseUsers>) => {
            // Prevent duplicates
            if (!state.favorites.some(user => user.id === action.payload.id)) {
                state.favorites.push(action.payload);
            }
        },
        removeFavorite: (state, action: PayloadAction<string>) => {
            state.favorites = state.favorites.filter(user => user.id !== action.payload);
        }
    }
})

export const { addFavorites, removeFavorite } = favoriteSlice.actions;
export default favoriteSlice.reducer;