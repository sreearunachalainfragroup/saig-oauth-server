export default function handler(req, res) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const SERVER_URL = process.env.SERVER_URL;

  const redirect = `${SERVER_URL}/callback`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirect,
    scope: "repo",
  });

  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
