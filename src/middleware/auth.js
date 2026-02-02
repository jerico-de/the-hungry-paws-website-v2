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

module.exports = { isLoggedIn, isAdmin };
