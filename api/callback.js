// api/callback.js
import fetch from "node-fetch";

async function exchangeCodeForToken(code, redirectUri) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri
  });

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: params
  });

  return response.json();
}

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    const SERVER_URL = process.env.SERVER_URL;

    if (!code) return res.status(400).send("Missing code");

    const redirectUri = `${SERVER_URL}/callback`;

    const tokenResponse = await exchangeCodeForToken(code, redirectUri);

    if (tokenResponse.error || !tokenResponse.access_token) {
      console.error("OAuth Error:", tokenResponse);
      return res.status(500).send("OAuth token exchange failed");
    }

    const accessToken = tokenResponse.access_token;

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>OAuth Complete</title>
  </head>
  <body>
    <h3>Login Successful. You can close this window.</h3>
    <script>
      (function() {
        const token = "${accessToken}";
        if (window.opener && window.opener.CMSOAuthCallback) {
          window.opener.CMSOAuthCallback({ token: token });
          window.close();
        } else {
          document.body.innerHTML =
            "<p>Token received. Please close this window manually.</p>";
        }
      })();
    </script>
  </body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
  } catch (err) {
    console.error("Callback Error:", err);
    return res.status(500).send("Server error");
  }
}
