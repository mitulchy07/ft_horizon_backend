
import { Router } from "express";
import { randomBytes } from "node:crypto";

const router = Router();
const API_URL = "https://api.intra.42.fr";

// Start login with 42
router.get("/42", (req, res, next) => {
  const clientId = process.env.INTRA42_CLIENT_ID;
  const redirectUri = process.env.INTRA42_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).json({
      error: "OAuth configuration is missing"
    });
    return;
  }

  const state = randomBytes(32).toString("hex");
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "public",
    state
  });

  req.session.save(error => {
    if (error) return next(error);

    res.redirect(`${API_URL}/oauth/authorize?${params}`);
  });
});

// 42 redirects here after authentication
router.get("/42/callback", async (req, res, next) => {
  const { code, state, error: oauthError } = req.query;

  if (typeof oauthError === "string") {
    res.status(400).json({
      error: "42 authorization was not completed"
    });
    return;
  }

  if (
    typeof code !== "string" ||
    typeof state !== "string" ||
    !req.session.oauthState ||
    state !== req.session.oauthState
  ) {
    res.status(400).json({
      error: "Invalid OAuth callback"
    });
    return;
  }

  delete req.session.oauthState;

  try {
    const tokenResponse = await fetch(`${API_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.INTRA42_CLIENT_ID!,
        client_secret: process.env.INTRA42_CLIENT_SECRET!,
        redirect_uri: process.env.INTRA42_REDIRECT_URI!,
        code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange: ${tokenResponse.status}`);
    }

    const token = await tokenResponse.json() as {
      access_token: string;
    };

    const userResponse = await fetch(`${API_URL}/v2/me`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`42 profile: ${userResponse.status}`);
    }

    const user = await userResponse.json() as {
      id: number;
      login: string;
      displayname: string;
    };

    req.session.regenerate(error => {
      if (error) return next(error);

      req.session.user = {
        id: user.id,
        login: user.login,
        name: user.displayname
      };

      req.session.save(error => {
        if (error) return next(error);

        res.redirect("/api/auth/me");
      });
    });
  } catch (error) {
    next(error);
  }
});

// Current authenticated student
router.get("/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({
      error: "Not authenticated"
    });
    return;
  }

  res.json(req.session.user);
});

// Logout
router.post("/logout", (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);

    res.clearCookie("connect.sid");

    res.json({
      message: "Successfully logged out"
    });
  });
});

export default router;
