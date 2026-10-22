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

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
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
  JWT_SECRET
}
