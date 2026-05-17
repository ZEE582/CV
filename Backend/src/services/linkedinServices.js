/**
 * @fileoverview LinkedIn Service
 * @description Handles LinkedIn OAuth helper logic:
 *              - Builds the LinkedIn authorization URL
 *              - Exchanges authorization code for access token
 *              - Fetches LinkedIn user profile
 *              - Finds or creates a LinkedIn user in MongoDB
 *
 * @module services/linkedinService
 */
import axios from "axios";
import User from "../models/usermodel.js";
const LINKEDIN_AUTH_URL ="https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL ="https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_PROFILE_URL ="https://api.linkedin.com/v2/userinfo";
export function buildLinkedInAuthUrl() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
    scope: "openid profile email",
  });
  return `${LINKEDIN_AUTH_URL}?${params}`;
}
export async function getLinkedInAccessToken(code) {
  const response = await axios.post(
    LINKEDIN_TOKEN_URL,
    new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
    {headers: {"Content-Type": "application/x-www-form-urlencoded",},
    }
  );
  return response.data.access_token;
}
export async function getLinkedInProfile(accessToken) {
  const response = await axios.get(
    LINKEDIN_PROFILE_URL,
    { headers: {Authorization: `Bearer ${accessToken}`,},
    }
  );
  return response.data;
}
export async function findOrCreateLinkedInUser(profile) {
  const email = profile.email?.toLowerCase();
  if (!email) {
    throw new Error("LinkedIn email not found");
  }
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name: profile.name || profile.given_name || "",
      linkedinId: profile.sub,
      provider: "linkedin",
      avatar: profile.picture || "",
    });
  }

  return user;
}