import { API_BASE_URL } from "../constants/api";

export function loginWithGoogle() {
  window.location.href = `${API_BASE_URL}/auth/google`;
}

export function loginWithGithub() {
  window.location.href = `${API_BASE_URL}/auth/github`;
}

export function loginWithLinkedin() {
  window.location.href = `${API_BASE_URL}/auth/linkedin`;
}