const { body, validationResult } = require('express-validator');

/**
 * Middleware de validation pour les matériaux
 */
const validateMaterial = [
  body('name')
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ max: 200 }).withMessage('Le nom ne peut pas dépasser 200 caractères'),
  
  body('type')
    .notEmpty().withMessage('Le type est requis'),
  
  body('price')
    .isNumeric().withMessage('Le prix doit être un nombre')
    .custom(value => value >= 0).withMessage('Le prix ne peut pas être négatif'),
  
  body('fournisseurId')
    .notEmpty().withMessage('L\'ID du fournisseur est requis'),
  
  body('unit')
    .optional()
    .isIn(['unité', 'mètre', 'm²', 'm³', 'kg', 'tonne', 'sac', 'botte', 'rouleau'])
    .withMessage('Unité invalide'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Middleware de validation pour les fournisseurs
 */
const validateSupplier = [
  body('name')
    .notEmpty().withMessage('Le nom est requis'),
  
  body('email')
    .isEmail().withMessage('Email invalide'),
  
  body('departement')
    .notEmpty().withMessage('Le département est requis'),
  
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s]+$/).withMessage('Numéro de téléphone invalide'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Middleware de validation pour l'authentification
 */
const validateAuth = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Middleware de validation pour les publicités
 */
const validatePublicite = [
  body('titre')
    .notEmpty().withMessage('Le titre est requis'),
  
  body('imageUrl')
    .notEmpty().withMessage('L\'URL de l\'image est requise')
    .isURL().withMessage('URL invalide'),
  
  body('materialId')
    .optional(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateMaterial,
  validateSupplier,
  validateAuth,
  validatePublicite
};