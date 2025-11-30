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
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const reqUrl = new URL(req.url, `${protocol}://${req.headers.host}`);
    const code = reqUrl.searchParams.get("code");

    if (!code) {
      return res.status(400).send("<h2>OAuth Error</h2><p>Missing OAuth code.</p>");
    }

    const SERVER_URL = process.env.SERVER_URL;
    if (!SERVER_URL) {
      return res.status(500).send("<h2>Server Error</h2><p>SERVER_URL not configured.</p>");
    }

    const redirectUri = `${SERVER_URL}/callback`;
    const token = await getToken(code, redirectUri);

    // Explicit frontend origin — replace with your CMS URL
    const FRONTEND_ORIGIN = "https://saig-vercel-repo.vercel.app";

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>OAuth Callback</title>
  </head>
  <body>
    <script>
      (function() {
        try {
          var token = "${encodeURIComponent(token)}";
          var msg = "authorizing:github:" + token;
          console.log("Sending OAuth token to parent window...");

          // Ensure opener exists
          if (window.opener) {
            // Send message multiple times for reliability
            window.opener.postMessage(msg, "${FRONTEND_ORIGIN}");
            setTimeout(() => {
              window.opener.postMessage(msg, "${FRONTEND_ORIGIN}");
              console.log("OAuth token sent. Closing popup...");
              window.close();
            }, 200);
          } else {
            document.body.innerText = "No parent window found. Token: " + token;
          }
        } catch (err) {
          console.error("OAuth callback error:", err);
          document.body.innerText = "OAuth callback error: " + err;
        }
      })();
    </script>
  </body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("<h2>OAuth Callback Error</h2><pre>" + err.message + "</pre>");
  }
}
