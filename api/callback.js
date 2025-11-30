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
    
  const code = req.query.code;
  const SERVER_URL = process.env.SERVER_URL;

  const redirectUri = `${SERVER_URL}/callback`;

  // Fetch the access token from GitHub
  const tokenData = await getToken(code, redirectUri);
  // Fetch the token
  const token = tokenData.access_token;

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

  } catch {
    console.error("OAuth callback error:----callback.js-->", err);
    res.status(500).send("Internal Server Error");
  }
}
