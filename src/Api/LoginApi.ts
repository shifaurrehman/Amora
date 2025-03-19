import axios, { AxiosResponse } from "axios";

const BASE_URL = "http://172.16.70.71:8080/api";

// Define the expected structure of the login response
interface LoginResponse {
  accessToken: string;
}

// =============
//  LOGIN CALL
//==============
export const login = async (email: string, password: string): Promise<AxiosResponse<LoginResponse>> => {
  try {
    console.log("Getting login response...");
    
    const response: AxiosResponse<LoginResponse> = await axios.post<LoginResponse>(`${BASE_URL}/login`, { email, password });
    
    console.log("Login response: ", response);
    return response;
  } catch (error) {
    console.error("Login error: ", error);
    throw error;
  }
};
