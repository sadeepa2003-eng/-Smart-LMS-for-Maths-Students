const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { authenticateToken, JWT_SECRET } = require('../middleware/auth')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, teacherInviteCode } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' })
    }

    const roles = req.body.roles === undefined ? ['student'] : req.body.roles
    if (
      !Array.isArray(roles) ||
      roles.length !== 1 ||
      roles.some((role) => !['student', 'teacher'].includes(role)) ||
      new Set(roles).size !== roles.length
    ) {
      return res.status(400).json({ message: 'Select exactly one valid account type.' })
    }

    if (roles.includes('teacher')) {
      if (!process.env.TEACHER_INVITE_CODE) {
        return res.status(503).json({ message: 'Teacher registration is not configured. Contact the LMS administrator.' })
      }
      if (typeof teacherInviteCode !== 'string' || teacherInviteCode !== process.env.TEACHER_INVITE_CODE) {
        return res.status(403).json({ message: 'A valid teacher invite code is required.' })
      }
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: roles.includes('teacher') ? 'teacher' : 'student',
      roles
    })

    await user.save()

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, roles, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role]
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, roles, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login.' })
  }
})

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role]
    res.json({ user: { ...user.toObject(), roles } })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error fetching user profile.' })
  }
})

module.exports = router
