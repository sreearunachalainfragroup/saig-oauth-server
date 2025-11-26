/* ========================
   File: api/auth.js
   Purpose: Start OAuth by redirecting to GitHub authorize URL
   ======================== */

export default function handler(req, res) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  if (!GITHUB_CLIENT_ID) {
    res.status(500).send('Missing GITHUB_CLIENT_ID');
    return;
  }

  // origin detection (preferred to use SERVER_URL env var in production)
  const origin = process.env.SERVER_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
  const redirectUri = process.env.OAUTH_REDIRECT_URI || `${origin}/callback`;

  const state = Math.random().toString(36).slice(2); // not persisted here (simple)
  const scope = process.env.SCOPE || 'repo';

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope,
    state,
    allow_signup: 'false'
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.writeHead(302, { Location: githubAuthUrl });
  res.end();
}