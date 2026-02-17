const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const { verifyFirebaseToken, verifyAdmin } = require('../config/firebase');

// Routes publiques
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.get('/:id/materials', supplierController.getSupplierMaterials);

// Routes protégées
router.post('/', 
  verifyFirebaseToken,
  [
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('departement').notEmpty().withMessage('Le département est requis')
  ],
  supplierController.createSupplier
);

router.put('/:id', 
  verifyFirebaseToken,
  supplierController.updateSupplier
);

// Routes admin seulement
router.delete('/:id', 
  verifyFirebaseToken,
  verifyAdmin,
  supplierController.deleteSupplier
);

module.exports = router;