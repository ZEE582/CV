import { API_BASE_URL } from "../constants/api";

export async function submitQuestions(form: unknown) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/user/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  const data = await response.json();
  return { response, data };
}