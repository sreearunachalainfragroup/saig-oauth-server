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

    // Return an HTML page that posts the exact message Decap expects,
    // tries to send to the opener's true origin if accessible, falls back to "*",
    // and waits a short moment before closing to allow the opener to handle it.
    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>OAuth callback</title>
  </head>
  <body>
    <script>
      (function(){
        try {
          var token = "${token}";
          var msg = "authorizing:github:" + token;

          // Try to read the opener's origin safely
          var targetOrigin = "*";
          try {
            // Accessing opener.location might throw if cross-origin
            var openerOrigin = window.opener && window.opener.location && window.opener.location.origin;
            if (openerOrigin) {
              targetOrigin = openerOrigin;
            }
          } catch (e) {
            // ignore — we'll use "*" below
            targetOrigin = "*";
          }

          console.log("OAuth callback: sending token. targetOrigin=", targetOrigin);

          // Send the message twice with different targetRestrictions to maximize chance of delivery
          try {
            window.opener.postMessage(msg, targetOrigin);
          } catch (e) {
            // fallback to wildcard
            try { window.opener.postMessage(msg, "*"); } catch(e2) { console.error("postMessage failed", e2); }
          }

          // Also send a second short-delayed message to increase reliability
          setTimeout(function(){
            try { window.opener.postMessage(msg, targetOrigin); } catch(e){ try{ window.opener.postMessage(msg, "*"); }catch(e2){ } }
          }, 250);

          // Give the opener a moment to handle the message, then close
          setTimeout(function(){ window.close(); }, 600);
        } catch (err) {
          console.error("OAuth callback page error:", err);
          document.body.innerText = "OAuth callback error: " + err;
        }
      })();
    </script>
  </body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("<h2>OAuth Callback Error</h2><pre>" + err.message + "</pre>");
  }
}
