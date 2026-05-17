import { API_BASE_URL } from "../constants/api";

export async function verifyCode(
  email: string,
  code: string
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/verify-code`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        email,
        code,
      }),
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
}