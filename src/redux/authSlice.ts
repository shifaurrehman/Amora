import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    loading: boolean;
    user: any | null;
    token: string | null;
    error: string | null;
    isOtpVerified: boolean;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    loading: false,
    user: null,
    token: null,
    error: null,
    isOtpVerified: false,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // Login Reducers
        loginRequest: (state, action: PayloadAction<{ email: string; password: string }>) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<{ token: string; user: any }>) => {
            state.loading = false;
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isOtpVerified = false; // Reset OTP verification status after login
            state.isAuthenticated = true;
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Signup Reducers
        signupRequest: (state, action: PayloadAction<{ email: string; password: string }>) => {
            state.loading = true;
            state.error = null;
        },
        signupSuccess: (state) => {
            state.loading = false;
        },
        signupFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // OTP Verification Reducers
        otpVerifyRequest: (state, action: PayloadAction<{ email: string; otp: string }>) => {
            state.loading = true;
            state.error = null;
        },
        otpVerifySuccess: (state) => {
            state.loading = false;
            state.error = null;
            state.isOtpVerified = true;
        },
        otpVerifyFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isOtpVerified = false;
        },

        // Logout Reducer (Optional)
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isOtpVerified = false;
            state.error = null;
        },
        checkTokenRequest: (state) => {
            state.loading = true;
        },
        checkTokenSuccess: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
            state.loading = false;
            state.isAuthenticated = !!action.payload;
        },
        checkTokenFailure: (state) => {
            state.token = null;
            state.loading = false;
            state.isAuthenticated = false;
        },
    },
});

export const {
    loginRequest,
    loginSuccess,
    loginFailure,
    signupRequest,
    signupSuccess,
    signupFailure,
    otpVerifyRequest,
    otpVerifySuccess,
    otpVerifyFailure,
    logout,
    checkTokenRequest,
    checkTokenSuccess,
    checkTokenFailure,
} = authSlice.actions;

export default authSlice.reducer;