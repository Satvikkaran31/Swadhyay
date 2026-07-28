export function isAdmin(req, res, next) {
  // TODO: re-enable once Google OAuth redirect URI is fixed in GCP Console
  // if (!req.session?.user) {
  //   return res.status(401).json({ error: 'Not authenticated' });
  // }
  // if (req.session.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Admin access required' });
  // }
  next();
}
