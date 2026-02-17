const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const materialController = require('../controllers/materialController');
const { verifyFirebaseToken, verifyAdmin, verifySupplier } = require('../config/firebase');

// Routes publiques
router.get('/', materialController.getAllMaterials);
router.get('/search', materialController.searchMaterials);
router.get('/stats', materialController.getMaterialStats);
router.get('/:id', [
  param('id').notEmpty().withMessage('ID requis')
], materialController.getMaterialById);

// Routes protégées (authentification requise)
router.post('/', 
  verifyFirebaseToken,
  verifySupplier,
  [
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('type').notEmpty().withMessage('Le type est requis'),
    body('price').isNumeric().withMessage('Le prix doit être un nombre'),
    body('fournisseurId').notEmpty().withMessage('L\'ID fournisseur est requis'),
    body('unit').optional().isIn(['unité', 'mètre', 'm²', 'm³', 'kg', 'tonne', 'sac', 'botte', 'rouleau'])
  ],
  materialController.createMaterial
);

router.put('/:id', 
  verifyFirebaseToken,
  materialController.updateMaterial
);

router.patch('/:id/stock',
  verifyFirebaseToken,
  verifySupplier,
  [
    body('quantity').isNumeric().withMessage('Quantité invalide'),
    body('operation').isIn(['add', 'remove', 'set']).withMessage('Opération invalide')
  ],
  materialController.updateStock
);

// Routes admin seulement
router.delete('/:id', 
  verifyFirebaseToken,
  verifyAdmin,
  materialController.deleteMaterial
);

module.exports = router;