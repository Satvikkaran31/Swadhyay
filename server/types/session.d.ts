import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      google_id: string;
      name: string;
      email: string;
      picture: string;
      role: string;
      verified: boolean;
    };
    tokens?: {
      access_token: string;
      refresh_token: string;
    };
  }
}
