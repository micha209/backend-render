const admin = require('firebase-admin');
require('dotenv').config();

// Configuration MongoDB (optionnelle, si vous voulez utiliser MongoDB en plus)
let mongoose;

try {
  if (process.env.MONGODB_URI) {
    mongoose = require('mongoose');
    
    const connectMongoDB = async () => {
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log('MongoDB connecté avec succès');
      } catch (error) {
        console.error('Erreur de connexion MongoDB:', error);
        process.exit(1);
      }
    };
    
    connectMongoDB();
  }
} catch (error) {
  console.log('MongoDB non configuré, utilisation de Firebase uniquement');
}

// Fonctions utilitaires pour Firebase Realtime Database
const firebaseDB = {
  // Lire toutes les données d'un chemin
  async get(path) {
    try {
      const snapshot = await admin.database().ref(path).once('value');
      return snapshot.val();
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${path}:`, error);
      throw error;
    }
  },
  
  // Lire une entrée spécifique
  async getById(path, id) {
    try {
      const snapshot = await admin.database().ref(`${path}/${id}`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${path}/${id}:`, error);
      throw error;
    }
  },
  
  // Créer une nouvelle entrée
  async create(path, data) {
    try {
      const ref = admin.database().ref(path).push();
      await ref.set(data);
      return { id: ref.key, ...data };
    } catch (error) {
      console.error(`Erreur lors de la création dans ${path}:`, error);
      throw error;
    }
  },
  
  // Mettre à jour une entrée
  async update(path, id, data) {
    try {
      await admin.database().ref(`${path}/${id}`).update(data);
      return { id, ...data };
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de ${path}/${id}:`, error);
      throw error;
    }
  },
  
  // Supprimer une entrée
  async delete(path, id) {
    try {
      await admin.database().ref(`${path}/${id}`).remove();
      return { id, deleted: true };
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${path}/${id}:`, error);
      throw error;
    }
  },
  
  // Requête avec filtrage
  async query(path, filters = {}) {
    try {
      let queryRef = admin.database().ref(path);
      
      // Appliquer les filtres si nécessaire
      if (filters.orderBy) {
        queryRef = queryRef.orderByChild(filters.orderBy);
      }
      
      if (filters.equalTo !== undefined) {
        queryRef = queryRef.equalTo(filters.equalTo);
      }
      
      if (filters.limitToFirst) {
        queryRef = queryRef.limitToFirst(filters.limitToFirst);
      }
      
      if (filters.limitToLast) {
        queryRef = queryRef.limitToLast(filters.limitToLast);
      }
      
      const snapshot = await queryRef.once('value');
      return snapshot.val();
    } catch (error) {
      console.error(`Erreur lors de la requête sur ${path}:`, error);
      throw error;
    }
  }
};

module.exports = {
  firebaseDB,
  mongoose
};