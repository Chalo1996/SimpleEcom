import express from "express";
import { check, body } from "express-validator";
import User from "../models/mongo_user.js"; // Import User model to check email existence
import {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
} from "../controllers/auth.js";

const Router = express.Router();

Router.get("/login", getLogin);

// Add validation checks for login
Router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Please enter a valid email."),
    body("password")
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage(
        "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character."
      ),
  ],
  postLogin
);

Router.post("/logout", postLogout);

Router.get("/signup", getSignup);

// Add validation checks for signup
Router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value) => {
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
          return Promise.reject("E-Mail address already exists.");
        }
      }),
    body("password")
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage(
        "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character."
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
  ],
  postSignup
);

Router.get("/reset", getReset);

// Add validation checks for password reset request
Router.post(
  "/reset",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value, { req }) => {
        // Check if the user exists with the provided email
        const userDoc = await User.findOne({ email: value });
        if (!userDoc) {
          return Promise.reject("No account with that email found.");
        }
      })
      .normalizeEmail(), // Sanitize email input
  ],
  postReset
);

Router.get("/reset/:token", getNewPassword);

// Add validation checks for setting a new password
Router.post(
  "/new-password",
  [
    body("password")
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage(
        "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character."
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
  ],
  postNewPassword
);

export default Router;
