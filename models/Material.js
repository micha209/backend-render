// Modèle pour MongoDB (optionnel)
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du matériau est requis'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  type: {
    type: String,
    required: [true, 'Le type de matériau est requis'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  unit: {
    type: String,
    required: [true, 'L\'unité de mesure est requise'],
    enum: ['unité', 'mètre', 'm²', 'm³', 'kg', 'tonne', 'sac', 'botte', 'rouleau'],
    default: 'unité'
  },
  fournisseurId: {
    type: String,
    required: [true, 'L\'ID du fournisseur est requis']
  },
  img: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  description: {
    type: String,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification
materialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour la recherche
materialSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Material', materialSchema);

// Pour Firebase, on n'a pas besoin de modèle, on utilise directement la DB