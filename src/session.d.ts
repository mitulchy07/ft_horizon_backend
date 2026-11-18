import "express-session";

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    user?: {
      id: number;
      login: string;
      name: string;
    };
  }
}