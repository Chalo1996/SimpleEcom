import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/mongo_user.js";
import { config } from "dotenv";
import { csrfConfig } from "../util/sessionmanager.js";
import crypto from "crypto";

config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export function getLogin(req, res, next) {
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = null;

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage,
  });
}

export function postLogin(req, res, next) {
  const errors = validationResult(req);
  const { email, password } = req.body;

  if (!errors.isEmpty()) {
    // Return validation errors
    return res.render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
    });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.session.errorMessage = "Invalid email or password.";
        return res.redirect("/login");
      }

      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;

            return req.session.save((err) => {
              if (err) console.error("Error saving session", err);
              res.redirect("/");
            });
          } else {
            req.session.errorMessage = "Invalid email or password.";
            res.redirect("/login");
          }
        })
        .catch((err) => {
          console.error("Error comparing passwords:", err);
          req.session.errorMessage =
            "Something went wrong. Please try again later.";
          res.redirect("/login");
        });
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      req.session.errorMessage =
        "Something went wrong. Please try again later.";
      res.redirect("/login");
    });
}

export function postLogout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).redirect("/");
    }

    // Clear the session cookie (if your session cookie name is "connect.sid")
    res.clearCookie("connect.sid", { path: "/" });

    // Clear the CSRF cookie explicitly using the same options
    res.clearCookie(csrfConfig.cookieName, {
      path: csrfConfig.cookieOptions.path,
      // If you set a domain when creating the cookie, include it here:
      // domain: csrfConfig.cookieOptions.domain,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    });

    res.redirect("/");
  });
}

export function getSignup(req, res, next) {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: null,
    oldInput: { name: "", email: "", password: "", confirmPassword: "" },
    isAuthenticated: false,
    csrfToken: req.csrfToken(),
  });
}

export function postSignup(req, res, next) {
  const errors = validationResult(req);
  const { name, email, password, confirmPassword } = req.body;
  const oldInput = { name, email, password, confirmPassword };

  if (!errors.isEmpty()) {
    return res.render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput,
      isAuthenticated: false,
      csrfToken: req.csrfToken(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        name,
        email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then(() => {
      // Send the email in the background without waiting
      transporter
        .sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: "Welcome to Our Service!",
          text: `Hi ${name},\n\nThank you for signing up! We hope you enjoy our service.\n\nBest Regards,\nThe Team`,
          html: `<p>Hi ${name},</p><p>Thank you for signing up! We hope you enjoy our service.</p><p>Best Regards,<br>The Team</p>`,
        })
        .catch((err) => {
          // Handle email errors independently
          console.error("Failed to send welcome email:", err);
        });

      // Redirect immediately after user is saved
      res.redirect("/login");
    })
    .catch((err) => {
      // Handle errors from bcrypt or user.save()
      console.error("Error during signup:", err);
      res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: "An error occurred. Please try again.",
        oldInput,
        isAuthenticated: false,
      });
    });
}

export function getReset(req, res, next) {
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = null;

  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage,
  });
}

export function postReset(req, res, next) {
  const errors = validationResult(req);
  const { email } = req.body;

  if (!errors.isEmpty()) {
    return res.render("auth/reset", {
      path: "/reset",
      pageTitle: "Reset Password",
      errorMessage: errors.array()[0].msg,
    });
  }

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.error(err);
      return res.redirect("/reset");
    }

    const token = buffer.toString("hex");

    User.findOne({ email })
      .then((user) => {
        if (!user) {
          req.session.errorMessage = "No account with that email found.";
          return res.redirect("/reset");
        }

        user.resetToken = token;
        user.resetTokenExpirationDate = Date.now() + 3600000; // 1 hour expiration
        return user.save();
      })
      .then(() => {
        const resetUrl = `https://simple-ecom-ruby.vercel.app/reset/${token}`;
        return transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: email,
          subject: "Password Reset",
          text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}. The link is valid for one hour.`,
          html: `<p>You requested a password reset.</p><p>Click the following link to reset your password:</p><a href="${resetUrl}">Reset Password</a><p>The link is valid for one hour.</p>`,
        });
      })
      .then(() => {
        res.redirect("/login");
      })
      .catch((err) => {
        console.error("Error during password reset:", err);
        res.redirect("/reset");
      });
  });
}

export function getNewPassword(req, res, next) {
  const { token } = req.params;

  User.findOne({
    resetToken: token,
    resetTokenExpirationDate: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.session.errorMessage = "Invalid or expired token.";
        return res.redirect("/reset");
      }

      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "Set a New Password",
        errorMessage: req.session.errorMessage,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.error("Error finding user by token:", err);
      res.redirect("/reset");
    });
}

export function postNewPassword(req, res, next) {
  const errors = validationResult(req);
  const { password, userId, passwordToken } = req.body;

  if (!errors.isEmpty()) {
    req.session.errorMessage = errors.array()[0].msg;
    return res.redirect("/reset");
  }

  User.findOne({
    _id: userId,
    resetToken: passwordToken,
    resetTokenExpirationDate: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.session.errorMessage = "Invalid or expired token.";
        return res.redirect("/reset");
      }

      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpirationDate = undefined;
          return user.save();
        })
        .then(() => {
          res.redirect("/login");
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}
