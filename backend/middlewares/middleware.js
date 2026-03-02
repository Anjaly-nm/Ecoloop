const jwt = require('jsonwebtoken');
const User = require('../models/user/users');
const SECRET_KEY = process.env.JWT_SECRET || 'secretKey'; // fallback if env not set

// Verify token and return user object
const verifyToken = async (req) => {
  try {
    // Extract token from Authorization header (Bearer token) or legacy token header
    let token = req.headers.token || req.body.token || req.query.token;
    
    // Check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) return { error: { status: 400, message: 'Token not provided.' } };

    const decoded = jwt.verify(token, SECRET_KEY); // decode JWT
    const foundUser = await User.findById(decoded.id);

    if (!foundUser) return { error: { status: 404, message: 'User not found.' } };

    return { user: foundUser };
  } catch (error) {
    return { error: { status: 500, message: 'Server error', detail: error.message } };
  }
};

// Middleware functions
module.exports = {
  isAdmin: async (req, res, next) => {
    const { user, error } = await verifyToken(req);
    if (error) return res.status(error.status).json({ message: error.message, detail: error.detail });

    if (user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    req.user = user;
    next();
  },

  isUser: async (req, res, next) => {
    const { user, error } = await verifyToken(req);
    if (error) return res.status(error.status).json({ message: error.message, detail: error.detail });

    if (user.role.toLowerCase() !== 'user') {
      return res.status(403).json({ message: 'Access denied. Users only.' });
    }

    req.user = user;
    next();
  },

  isCollector: async (req, res, next) => {
    const { user, error } = await verifyToken(req);
    if (error) return res.status(error.status).json({ message: error.message, detail: error.detail });

    if (user.role.toLowerCase() !== 'collector') {
      return res.status(403).json({ message: 'Access denied. Collectors only.' });
    }

    req.user = user; // logged-in collector
    next();
  },

  isSeller: async (req, res, next) => {
    const { user, error } = await verifyToken(req);
    if (error) return res.status(error.status).json({ message: error.message, detail: error.detail });

    if (user.role.toLowerCase() !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Sellers only.' });
    }

    req.user = user; // logged-in seller
    next();
  },

  authenticateToken: async (req, res, next) => {
    const { user, error } = await verifyToken(req);
    if (error) return res.status(error.status).json({ message: error.message, detail: error.detail });

    req.user = user; // logged-in user
    next();
  },
};