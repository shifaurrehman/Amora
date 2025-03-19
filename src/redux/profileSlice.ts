import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProfileState {
    Profile: {
        name: string;
        age: string;
        location: string;
        gender: string;
        profession: string;
        education: string;
        height: string;
        weight: string;
        languages: number[];
        hobbies: string;
        sect: string;
        city: string;
        extraImages: { uri: string; type: string; fileName: string }[] | null;
        profileImage: { uri: string; type: string; fileName: string } | null;
        employmentStatus?: string;
        maritalStatus?: string;
        dateOfBirth?: string;
    },
    genders: { id: number; name: string }[];
    religions: { id: number; name: string }[];
    languages: { id: number; name: string }[];
    employmentStatuses: { id: number; name: string }[];
    professions: { id: number; name: string }[];
    educationLevels: { id: number; name: string }[];
    sects: { id: number; name: string }[];
    cities: { id: number; name: string }[];
    maritalStatuses: { id: number; name: string }[];
    loading: boolean;
    error: string | null;
}

const initialState: ProfileState = {
    Profile: {
        name: '',
        age: '',
        location: '',
        gender: '',
        profession: '',
        education: '',
        height: '',
        weight: '',
        languages: [],
        hobbies: '',
        sect: '',
        city: '',
        extraImages: [],
        profileImage: null,
        dateOfBirth: '',
    },
    genders: [],
    religions: [],
    languages: [],
    employmentStatuses: [],
    professions: [],
    educationLevels: [],
    sects: [],
    cities: [],
    maritalStatuses: [],
    loading: false,
    error: null,
}

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {
        setProfileState: (state, action: PayloadAction<Partial<ProfileState["Profile"]>>) => {
            state.Profile = { ...state.Profile, ...action.payload }
        },
        fetchOptionsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchOptionsSuccess: (state, action: PayloadAction<Partial<ProfileState>>) => {
            state.loading = false;
            if(action.payload){
                state.genders = action.payload.genders || state.genders;
                state.religions = action.payload.religions || state.religions;
                state.languages = action.payload.languages || state.languages;
                state.employmentStatuses = action.payload.employmentStatuses || state.employmentStatuses;
                state.professions = action.payload.professions || state.professions;
                state.educationLevels = action.payload.educationLevels || state.educationLevels;
                state.sects = action.payload.sects || state.sects;
                state.cities = action.payload.cities || state.cities;
                state.maritalStatuses = action.payload.maritalStatuses || state.maritalStatuses;
            }
        },
        fetchOptionsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        saveProfileStart: (state, action: PayloadAction<Partial<ProfileState['Profile']>>) => {
            state.loading = true;
            state.error = null;
        },
        saveProfileSuccess: (state, action:  PayloadAction<ProfileState["Profile"]>) => {
            state.loading = false;
            state.Profile = action.payload;
        },
        saveProfileFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
})

export const {
    setProfileState,
    fetchOptionsStart,
    fetchOptionsSuccess,
    fetchOptionsFailure,
    saveProfileStart,
    saveProfileSuccess,
    saveProfileFailure,
} = profileSlice.actions;

export default profileSlice.reducer;
