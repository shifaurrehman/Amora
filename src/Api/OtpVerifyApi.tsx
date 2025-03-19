import axios, { AxiosResponse } from "axios";

const BASE_URL = "http://172.16.70.71:8080/api";

// Define the expected response type
interface VerifyOtpResponse {
  message: string;
  status: string;
  accessToken?: string; // If your API returns a token
}

// ===================
//  VERIFICATION CALL
// ===================
export const verifyOtpFromBackend = async (
  email: string,
  otp: string
): Promise<AxiosResponse<VerifyOtpResponse>> => {
  try {
    const response = await axios.post<VerifyOtpResponse>(
      `${BASE_URL}/activate`,
      { email, otp },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Response from OTP verification: ", response);
    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
};
