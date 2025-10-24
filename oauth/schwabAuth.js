const axios = require("axios");
const { URLSearchParams } = require("url");

const AUTH_URL = "https://api.schwabapi.com/v1/oauth/authorize";
const TOKEN_URL = "https://api.schwabapi.com/v1/oauth/token";

const clientId = process.env.SCHWAB_CLIENT_ID;
const clientSecret = process.env.SCHWAB_CLIENT_SECRET;
const redirectUri = process.env.SCHWAB_REDIRECT_URI;
const scope = process.env.SCHWAB_SCOPE || "readonly";

// In-memory token cache (replace with Mongo/Redis in production)
let tokenBundle = null; // { access_token, refresh_token, expires_at }

function getAuthUrl() {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
  });
  // User will log in at Schwab → redirect back with ?code=...
  return `${AUTH_URL}?${q.toString()}`;
}

async function exchangeCodeForToken(code) {
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  // Basic auth header with client_id:client_secret
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const { data } = await axios.post(TOKEN_URL, form.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
  });

  // expires_in is seconds; compute absolute expiry buffer
  tokenBundle = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };
  return tokenBundle;
}

async function refreshAccessToken() {
  if (!tokenBundle?.refresh_token) throw new Error("No refresh token");

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenBundle.refresh_token,
  });

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const { data } = await axios.post(TOKEN_URL, form.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
  });

  tokenBundle = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokenBundle.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenBundle;
}

async function getValidAccessToken() {
  if (tokenBundle?.access_token && Date.now() < tokenBundle.expires_at) {
    return tokenBundle.access_token;
  }
  if (tokenBundle?.refresh_token) {
    await refreshAccessToken();
    return tokenBundle.access_token;
  }
  throw new Error("User not authenticated with Schwab yet.");
}

async function handleCallback(code) {
  if (!code) throw new Error("Missing code");
  return exchangeCodeForToken(code);
}

module.exports = {
  getAuthUrl,
  handleCallback,
  getValidAccessToken,
  // for testing/inspection
  _tokenBundle: () => tokenBundle,
};
