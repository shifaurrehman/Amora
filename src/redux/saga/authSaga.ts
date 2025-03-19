import { call, put, takeLatest } from "redux-saga/effects";
import axios, { AxiosResponse } from "axios";
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  otpVerifyRequest,
  otpVerifySuccess,
  otpVerifyFailure,
  checkTokenRequest,
  checkTokenSuccess,
  checkTokenFailure,
} from "../authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://172.16.70.71:8080/api";

// Function to get token from AsyncStorage
const getTokenFromStorage = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('UserToken');
};

// Login API
const loginApi = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, { email, password });
    console.log("loginApi method response", response);
    

    // ✅ Validate token before returning
    if (response.status === 200 && response.data.accessToken) {
      return response.data;
    } else {
      throw new Error("Invalid login credentials or missing token");
    }
  } catch (error: any) {
    console.log("loginApi method response", error);
    throw new Error(error || "Login failed");
  }
};

// Signup API
const signupApi = async (email: string, password: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/register`,
      { email, password }
    );

    console.log("Signup API Response:", response); // ✅ Logs response after receiving it

    if (response.status === 200 && response.data.status === "success") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Signup failed");
    }
  } catch (error: any) {
    console.error("Signup API Error:", error);
    throw new Error(error || "Signup failed");
  }
};

// OTP Verification API
const otpVerifyApi = async (email: string, otp: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/activate`, { email, otp });

    // ✅ Ensure a valid response is returned
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Invalid OTP or any other issue.");
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "OTP Verification failed");
  }
};
// Worker Saga: Handles Login
function* handleLogin(action: ReturnType<typeof loginRequest>) {
  try {
    const { email, password } = action.payload;
    const data = yield call(loginApi, email, password);

    if (data.accessToken && typeof data.accessToken === "string") {
      yield AsyncStorage.setItem("authToken", data.accessToken);
      yield put(loginSuccess({ token: data.accessToken, user: data.user }));
    } else {
      throw new Error("Invalid token received"); // Prevents fake token injection
    }
  } catch (error: any) {
    yield put(loginFailure(error.response?.data?.message || "Login failed"));
  }
}

// Worker Saga Handles Signup
function* handleSignup(action: ReturnType<typeof signupRequest>) {
  try {
    const { email, password } = action.payload;
    yield call(signupApi, email, password);
    yield put(signupSuccess());
  } catch (error: any) {
    yield put(signupFailure(error.response?.data?.message || "Signup failed"));
  }
}

// Worker Saga: Handles OTP Verification
function* handleOtpVerification(action: ReturnType<typeof otpVerifyRequest>) {
  try {
    const { email, otp } = action.payload;
    const response = yield call(otpVerifyApi, email, otp);

    if (response.status === 200) {
      yield put(otpVerifySuccess());  // OTP verified successfully
    } else {
      yield put(otpVerifyFailure(response.data.message || "OTP Verification failed"));
    }
  } catch (error: any) {
    yield put(otpVerifyFailure(error.response?.data?.message || "OTP Verification failed"));
  }
}

function* checkTokenSaga()  {
  try {
    const token: string | null = yield call(getTokenFromStorage);
    if (token) {
      const decodedToken: { exp: number } = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        yield AsyncStorage.removeItem("UserToken");
        yield put(checkTokenFailure());
      } else {
        yield put(checkTokenSuccess(token));
      }
    } else {
      yield put(checkTokenFailure());
    }
  } catch (error) {
    console.error('Error checking token:', error);
    yield put(checkTokenFailure());
  }
}

// Watcher Saga
export function* watchAuthSaga() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(signupRequest.type, handleSignup);
  yield takeLatest(otpVerifyRequest.type, handleOtpVerification);
  yield takeLatest(checkTokenRequest.type, checkTokenSaga);
}
