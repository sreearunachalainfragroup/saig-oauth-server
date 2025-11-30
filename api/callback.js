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

  return response.json();
}

export default async function handler(req, res) {
  const code = req.query.code;
  const SERVER_URL = process.env.SERVER_URL;

  const redirectUri = `${SERVER_URL}/callback`;

  const tokenData = await getToken(code, redirectUri);

  const html = `
<!doctype html>
<html>
  <body>
    <script>
    console.log("📌 Sending OAuth token back to CMS…");
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
}
