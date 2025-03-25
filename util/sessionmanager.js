import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";
import { doubleCsrf } from "csrf-csrf";
import crypto from "crypto";
import { config } from "dotenv";

config();

const MongoDBStore = connectMongoDBSession(session);

export const configureSession = (uri) => {
  const store = new MongoDBStore({
    uri: uri,
    collection: "sessions",
  });

  store.on("error", (error) => {
    console.error("Session store error:", error);
  });

  return session({
    secret: process.env.COOKIE_SIGN,
    saveUninitialized: true,
    resave: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });
};

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: (req) => {
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = crypto.randomBytes(64).toString("hex");
    }
    return req.session.csrfSecret;
  },
  cookieName: "_csrf",
  cookieOptions: {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  // Ensure the token is read from the body if available
  getTokenFromRequest: (req) => {
    const csrfTokenFromCookie = req.cookies["_csrf"];
    if (csrfTokenFromCookie) {
      // Split the token and return only the first part
      return csrfTokenFromCookie.split("|")[0];
    }
    return req.body._csrf || req.headers["x-csrf-token"];
  },
});

export { doubleCsrfProtection, generateToken };
