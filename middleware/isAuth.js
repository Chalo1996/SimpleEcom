// Middleware for routes protection
export const Auth = (req, res, next) => {
  if (req.session.isLoggedIn) {
    // User is authenticated, proceed to the next middleware/route handler
    return next();
  }
  // User is not authenticated
  res.redirect("/login");
};
