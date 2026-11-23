import { API_BASE_URL } from "../constants/api";

interface SignupResponse {
  message?: string;
  email?: string;
  requiresVerification?: boolean;
  errors?: { field: string; message: string }[];
}
export async function signupUser(email: string, password: string, fullName: string) {
  const response = await fetch(API_BASE_URL + "/auth/signup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName.trim().replace(/\s+/g, " "),
    }),
  });
  const data: SignupResponse = await response.json().catch(() => ({}));
  return { response, data };
}
