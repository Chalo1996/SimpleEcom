import express from "express";
import path from "path";
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

config();

const uri = process.env.MONGO_URI;
const app = express();
const viewPath = [process.cwd(), "views"];

// Configure view engine
app.set("view engine", "ejs");
app.set("views", path.join(...viewPath));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

// Session configuration
app.use(configureSession(uri));

// Register cookie-parser (after session if using express-session)
app.use(cookieParser());

// CSRF Protection (applied globally)
app.use(doubleCsrfProtection);

// Attach user to request object
app.use((req, res, next) => {
  if (!req.session.user) return next();
  User.findOne({ email: req.session.user.email })
    .then((user) => {
      req.user = user || null;
      next();
    })
    .catch(next);
});

// Set local variables (CSRF token available to views)
// Use req.csrfToken() provided by doubleCsrfProtection middleware
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken(req, res);
  res.locals.user = req.user;
  next();
});

// Routes
app.use("/admin", Auth, adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Error handling
app.use(getErrorPage);
app.use((error, req, res, next) => {
  console.log(`ERROR: ${error}`);
  res.status(500).render("errors/error-page", {
    pageTitle: "Error",
    path: "/error-page",
    errorMessage: error.message || "Something went wrong!",
  });
});

// Database connection and server start
const connectToDatabase = async () => {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    app.listen(3000, () => console.log("Server listening on port 3000"));
  } catch (error) {
    console.error("Connection error:", error);
  }
};

connectToDatabase();

export default app;
