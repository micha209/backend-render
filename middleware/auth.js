const { auth } = require('../config/firebase');

/**
 * Middleware pour vérifier le token Firebase
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    const { db } = require('../config/firebase');
    
    const snapshot = await db.ref(`admin/${req.user.uid}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Droits administrateur requis'
      });
    }
    
    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des droits'
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est fournisseur
 */
const requireSupplier = async (req, res, next) => {
  try {
    const { db } = require('../config/firebase');
    
    const snapshot = await db.ref('fournisseur').once('value');
    const suppliers = snapshot.val();
    
    let isSupplier = false;
    let supplierId = null;
    
    if (suppliers) {
      for (const key in suppliers) {
        if (suppliers[key].email === req.user.email || suppliers[key].id === req.user.uid) {
          isSupplier = true;
          supplierId = key;
          break;
        }
      }
    }
    
    if (!isSupplier) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Compte fournisseur requis'
      });
    }
    
    req.user.supplierId = supplierId;
    next();
  } catch (error) {
    console.error('Erreur vérification fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des droits'
    });
  }
};

/**
 * Middleware pour limiter le taux de requêtes par IP
 */
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const timestamps = requests.get(ip).filter(timestamp => now - timestamp < windowMs);
    
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard'
      });
    }
    
    timestamps.push(now);
    requests.set(ip, timestamps);
    
    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireSupplier,
  rateLimiter
};