import { API_BASE_URL } from "../constants/api";

export async function signupUser(
  email: string,
  password: string
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/signup`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        email,
        password,
        role: "user",
      }),
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
}