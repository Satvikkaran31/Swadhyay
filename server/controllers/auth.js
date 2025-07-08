export function ensureAuthenticated(req, res, next) {
  console.log("Session:", req.session);
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'User not authenticated' });
}
