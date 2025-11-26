import fetch from 'node-fetch';

/* Exchange code for GitHub access token */
async function exchangeCodeForToken(code, redirect_uri) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
    redirect_uri
  });

  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: params
  });

  const data = await resp.json();
  return data;
}

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const origin = process.env.SERVER_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const redirectUri = process.env.OAUTH_REDIRECT_URI || `${origin}/callback`;

    const tokenResp = await exchangeCodeForToken(code, redirectUri);
    if (tokenResp.error) return res.status(500).send('OAuth error');

    const token = tokenResp.access_token;
    if (!token) return res.status(500).send('No access token received');

    // HTML that passes token to CMS and closes popup
    const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>OAuth Complete</title></head>
  <body>
    <h3>Login Success. You can close this window.</h3>
    <script>
      (function() {
        const token = '${token}';
        if (window.opener && window.opener.CMSOAuthCallback) {
          window.opener.CMSOAuthCallback({ token: token });
          window.close();
        } else {
          document.body.innerText = 'Login complete. Please close this window.';
        }
      })();
    </script>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}
