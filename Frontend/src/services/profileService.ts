import { API_BASE_URL } from "../constants/api";

export async function getProfile() {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/user/profile`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  return {
    response,
    data,
  };
}