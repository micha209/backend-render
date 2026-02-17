// Configuration de l'application
window.API_CONFIG = {
  // À modifier selon votre environnement
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'  // Développement local
    : 'https://votre-backend.onrender.com/api', // Production sur Render
  
  // Version de l'API
  API_VERSION: 'v1',
  
  // Timeout des requêtes (en ms)
  API_TIMEOUT: 30000,
  
  // Stockage local
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    DEVIS: 'devisItems'
  }
};

// Rendre la configuration accessible globalement
const API_CONFIG = window.API_CONFIG;