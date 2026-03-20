const { verifyToken } = require("../utils/jwt");

function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  next();
}

function isAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
}

// Checks JWT token first, falls back to session
function requireAuth(req, res, next) {
  // Check JWT from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
    // Token present but invalid
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  // Fall back to session
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  return res.status(401).json({ success: false, message: "Unauthorized" });
}

// JWT + Session — admin only
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Admins only" });
    }
    next();
  });
}

function requireEmployee(req, res, next) {
  if (req.session?.employee) {
    req.employee = req.session.employee; // { id, name, role }
    return next();
  }
  res.status(401).json({ success: false, message: "Employee login required" });
}

module.exports = { isLoggedIn, isAdmin, requireAuth, requireAdmin, requireEmployee };
