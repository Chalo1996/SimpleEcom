import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";
import { doubleCsrf } from "csrf-csrf";
import crypto from "crypto";
import { config } from "dotenv";

config();

const MongoDBStore = connectMongoDBSession(session);

export const configureSession = (client) => {
  const store = new MongoDBStore({
    client: client,
    collection: "sessions",
    ttl: 7 * 24 * 60 * 60, // 7 days
  });

  return new Promise((resolve, reject) => {
    store.once("connected", () => {
      resolve(
        session({
          secret: process.env.COOKIE_SIGN,
          saveUninitialized: false,
          resave: false,
          proxy: true,
          rolling: true,
          store: store,
          cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          },
        })
      );
    });
    store.on("error", reject);
  });
};

const csrfConfig = {
  getSecret: (req) => {
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = crypto.randomBytes(64).toString("hex");
    }
    return req.session.csrfSecret;
  },
  cookieName:
    process.env.NODE_ENV === "production"
      ? "__Host-psifi.x-csrf-token"
      : "dev-csrf-token",
  cookieOptions: {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
  },
  size: 64,
  getSessionIdentifier: (req) => req.sessionID,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.body._csrf,
};

const { generateToken, doubleCsrfProtection } = doubleCsrf(csrfConfig);

export { doubleCsrfProtection, generateToken };
