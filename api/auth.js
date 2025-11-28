// api/auth.js
import crypto from "crypto";

export default function handler(req, res) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const SERVER_URL = process.env.SERVER_URL;  // Example: https://saig-oauth-server.vercel.app

  if (!CLIENT_ID || !SERVER_URL) {
    return res.status(500).send("Missing environment variables");
  }

  // GitHub must return to /callback
  const redirectUri = `${SERVER_URL}/callback`;

  // Required for OAuth security
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "repo",
    state
  });

  return res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
