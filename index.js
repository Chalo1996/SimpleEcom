import express from "express";
import path from "path";
import helmet from "helmet";
import hpp from "hpp";
import adminRoutes from "./routes/admin.js";
import shopRoutes from "./routes/shop.js";
import authRoutes from "./routes/auth.js";
import { getErrorPage } from "./controllers/error.js";
import User from "./models/mongo_user.js";
import mongoose from "mongoose";
import {
  configureSession,
  doubleCsrfProtection,
} from "./util/sessionmanager.js";
import { Auth } from "./middleware/isAuth.js";
import { config } from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";

config();

const uri = process.env.MONGO_URI;
const app = express();
const viewPath = [process.cwd(), "views"];

// Security Configuration
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(hpp());
app.use(compression());

// Application Setup
app.set("view engine", "ejs");
app.set("views", path.join(...viewPath));
app.use(express.static(path.join(process.cwd(), "public")));
app.use(bodyParser.urlencoded({ extended: true, limit: "10kb" }));

// Database Connection First
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  initializeApp();
});

async function initializeApp() {
  try {
    // Session Configuration after DB connection
    const sessionMiddleware = await configureSession(
      mongoose.connection.getClient()
    );

    // Middleware
    app.use(sessionMiddleware);
    app.use(cookieParser());
    app.use(doubleCsrfProtection);

    // Context middleware
    app.use((req, res, next) => {
      res.locals.isAuthenticated = req.session.isLoggedIn || false;
      res.locals.csrfToken = req.csrfToken();
      res.locals.path = req.path;
      next();
    });

    // User authentication
    app.use((req, res, next) => {
      if (!req.session.user) return next();
      User.findOne({ email: req.session.user.email })
        .then((user) => {
          req.user = user || null;
          next();
        })
        .catch(next);
    });

    // Routes
    app.use("/admin", Auth, adminRoutes);
    app.use(shopRoutes);
    app.use(authRoutes);

    // Error handlers
    app.use((err, req, res, next) => {
      if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).render("errors/csrf-error", {
          pageTitle: "Invalid CSRF Token",
          path: req.path,
          errorMessage: "Session expired. Please refresh the page.",
          isAuthenticated: false,
          csrfToken: "",
        });
      }
      next(err);
    });

    app.use(getErrorPage);
    app.use((error, req, res, next) => {
      console.error(`[${new Date().toISOString()}] ERROR: ${error.stack}`);
      res.status(500).render("errors/error-page", {
        pageTitle: "Error",
        path: "/error-page",
        errorMessage:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong! Please try again later.",
        isAuthenticated: false,
        csrfToken: "",
      });
    });

    // Start server
    app.listen(3000, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode`
      );
    });
  } catch (error) {
    console.error("Application initialization failed:", error);
    process.exit(1);
  }
}

// Database Connection with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(uri, {
      tls: true,
      serverSelectionTimeoutMS: 80000,
      socketTimeoutMS: 95000,
      retryWrites: true,
      w: "majority",
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB - retrying in 5 seconds");
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

export default app;
