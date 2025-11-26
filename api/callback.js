import fetch from "node-fetch";

async function getToken(code, redirect) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
    redirect_uri: redirect
  });

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: params
  });

  return res.json();
}

export default async function handler(req, res) {
  const code = req.query.code;
  const SERVER_URL = process.env.SERVER_URL;

  const redirect = `${SERVER_URL}/callback`;

  const token = await getToken(code, redirect);

  const html = `
<!doctype html>
<html>
  <body>
    <script>
      window.opener.CMSOAuthCallback({ token: "${token.access_token}" });
      window.close();
    </script>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
}
