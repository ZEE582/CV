import { API_BASE_URL } from "../constants/api";

export async function resendCode(
  email: string
) {
  const response = await fetch(
    `${API_BASE_URL}/auth/resend-code`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        email,
      }),
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
}