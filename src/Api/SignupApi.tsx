import axios, { AxiosResponse } from "axios";

const BASE_URL = "http://172.16.70.71:8080/api";

// Define the expected response type
interface SignupResponse {
  message: string;
  status: string;
  userId?: string; // If the API returns a user ID upon successful signup
}

// =============
//  SIGNUP CALL
// =============
export const signup = async (
  email: string,
  password: string
): Promise<AxiosResponse<SignupResponse>> => {
  try {
    console.log("Getting signup response...");

    const response = await axios.post<SignupResponse>(
      `${BASE_URL}/register`,
      { email, password }
    );
    
    console.log("Signup response: ", response);
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};
