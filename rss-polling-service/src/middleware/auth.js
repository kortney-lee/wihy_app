const jwt = require('jsonwebtoken');
const { getUserById } = require('../services/userService');

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getUserById(decoded.id);
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
};