import fetch from "node-fetch";

async function getToken(code, redirectUri) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: params,
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`GitHub token not received: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export default async function handler(req, res) {
  try {
    // FIX: Correct protocol (Vercel uses https)
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const reqUrl = new URL(req.url, `${protocol}://${req.headers.host}`);

    const code = reqUrl.searchParams.get("code");
    if (!code) {
      return res.status(400).send(`
        <h2>OAuth Error</h2>
        <p>Missing OAuth code in request.</p>
      `);
    }

    const SERVER_URL = process.env.SERVER_URL;
    if (!SERVER_URL) {
      return res.status(500).send(`
        <h2>Server Error</h2>
        <p>Server URL not configured.</p>
      `);
    }

    const redirectUri = `${SERVER_URL}/callback`;

    // This now returns the RAW token string. Fetch the GitHub access token
    const token = await getToken(code, redirectUri);

    // HTML to send token back to CMS
    const html = `
<!doctype html>
<html>
  <body>
    <script>
      console.log("Sending OAuth token back to CMS…");
      window.opener.postMessage(
        {
          type: "authorization_response",
          response: { token: "${token}" }
        },
        "*"
      );
      window.close();
    </script>
  </body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    console.error("OAuth callback error:", err);
    // User-friendly error page
    res.status(500).send(`
      <h2>OAuth Callback Error</h2>
      <p>Something went wrong while processing the OAuth callback.</p>
      <pre>${err.message}</pre>
    `);
  }
}
