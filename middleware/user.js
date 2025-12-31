const { verifyToken } = require('../service/auth');

async function authenticate(req, res, next) {
  const token = req.cookies?.token;
  console.log("Middleware token:", token);

  // If no token → force login
  if (!token) {
    return res.render("signin", { message: "Please login first" });
  }

  let user;

  // Safely verify token
  try {
    user = await verifyToken(token);
  } catch (err) {
    console.log("Token verification failed:", err.message);
    return res.render("signin", { message: "Invalid or expired token" });
  }

  // If token is invalid
  if (!user) {
    return res.render("signin", { message: "Invalid token" });
  }

  // Attach user to req object
  req.user = user;
  next();
};

module.exports = authenticate;
