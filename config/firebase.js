const admin = require('firebase-admin');
require('dotenv').config();

// Initialisation de Firebase Admin SDK
let firebaseApp;

try {
  // Vérifier si Firebase est déjà initialisé
  if (admin.apps.length === 0) {
    // Configuration avec variables d'environnement
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log('Firebase Admin SDK initialisé avec succès');
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase:', error);
  process.exit(1); // Arrêter l'application si Firebase ne peut pas être initialisé
}

// Références aux services Firebase
const db = admin.database();
const auth = admin.auth();
const firestore = admin.firestore();

// Middleware pour vérifier l'authentification Firebase
const verifyFirebaseToken = async (req, res, next) => {
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
    console.error('Erreur de vérification du token:', error);
    
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

// Middleware pour vérifier si l'utilisateur est admin
const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    // Vérifier dans Firebase Realtime Database
    const snapshot = await db.ref(`admin/${userId}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé - Admin uniquement' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur de vérification admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification des droits admin' 
    });
  }
};

// Middleware pour vérifier si l'utilisateur est fournisseur
const verifySupplier = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email;
    
    // Vérifier dans Firebase Realtime Database
    const snapshot = await db.ref('fournisseur').once('value');
    const suppliers = snapshot.val();
    
    let isSupplier = false;
    
    if (suppliers) {
      for (const key in suppliers) {
        if (suppliers[key].email === userEmail || suppliers[key].id === userId) {
          isSupplier = true;
          req.supplierId = key;
          break;
        }
      }
    }
    
    if (!isSupplier) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé - Fournisseur uniquement' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur de vérification fournisseur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification des droits fournisseur' 
    });
  }
};

module.exports = {
  admin,
  db,
  auth,
  firestore,
  verifyFirebaseToken,
  verifyAdmin,
  verifySupplier
};