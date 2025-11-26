/* ========================
   File: api/callback.js
   Purpose: Exchange code for access token and return token to popup
   ======================== */

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
  return data; // { access_token, token_type, scope } or { error }
}

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const origin = process.env.SERVER_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const redirectUri = process.env.OAUTH_REDIRECT_URI || `${origin}/callback`;

    const tokenResp = await exchangeCodeForToken(code, redirectUri);
    if (tokenResp.error) {
      console.error('OAuth error', tokenResp);
      return res.status(500).send('OAuth error');
    }

    const token = tokenResp.access_token;
    if (!token) return res.status(500).send('No access token received');

    // Return a small HTML page that posts the token back to the opener window and closes
    const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>OAuth Complete</title></head>
  <body>
    <script>
      (function(){
        function receiveMessage(e){ /* no-op - not used */ }
        window.opener.postMessage({ type: 'decap-oauth', token: '${token}' }, '*');
        // fallback: write token to page so manual copy is possible
        document.body.innerText = 'Login complete. You can close this window.';
        setTimeout(function(){ window.close(); }, 1000);
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