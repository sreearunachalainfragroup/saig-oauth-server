/* ========================
   File: README.md (instructions)
   ======================== */

/*
README - Deploy Decap OAuth Server to Vercel

Files included:
- package.json
- vercel.json
- api/auth.js
- api/callback.js

Environment variables required (set in Vercel project settings):
- GITHUB_CLIENT_ID    -> GitHub OAuth App Client ID
- GITHUB_CLIENT_SECRET -> GitHub OAuth App Client Secret
- SERVER_URL (optional but recommended) -> https://your-vercel-app.vercel.app
- OAUTH_REDIRECT_URI (optional) -> e.g. https://your-vercel-app.vercel.app/callback
- SCOPE (optional) -> default 'repo' (adjust if you only need limited scopes)

Steps to deploy:
1. Create a new GitHub repo and push these files.
2. In GitHub, create a new OAuth App (Settings -> Developer settings -> OAuth Apps)
   - Application name: your app
   - Homepage URL: https://saig-admin.netlify.app (or your site)
   - Authorization callback URL: https://your-vercel-app.vercel.app/callback
3. In Vercel, import the repo and set the environment variables above.
4. Deploy. Your server will be available at https://your-vercel-app.vercel.app

Decap CMS config snippet (use this in your config.yml):
backend:
  name: github
  repo: sreearunachalainfragroup/saig-repo
  branch: main
  base_url: https://your-vercel-app.vercel.app
  auth_endpoint: auth

Notes:
- We use vercel.json route rewrites to expose /auth and /callback at root instead of /api/*.
- The callback endpoint returns the access token via window.opener.postMessage. Decap/Netlify-CMS
  uses a popup flow and will receive this message.
- For security, in production you should implement a state mechanism (persisting per-session state)
  and validate it on callback. This example uses a simple random state that is NOT validated.
- Consider restricting OAuth scopes to the minimum required.
*/