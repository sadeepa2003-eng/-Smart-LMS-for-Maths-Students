const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'smart_maths_lms_super_secret_key_2026'

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' })
    }
    req.user = user
    next()
  })
}

function hasRole(user, role) {
  const roles = Array.isArray(user?.roles) && user.roles.length > 0
    ? user.roles
    : [user?.role]
  return roles.includes(role)
}

function requireRole(role) {
  return (req, res, next) => {
    if (!hasRole(req.user, role)) {
      return res.status(403).json({
        message: `Forbidden: This action requires the '${role}' role.`
      })
    }
    next()
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  hasRole,
  JWT_SECRET
}
