const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const publiciteController = require('../controllers/publiciteController');
const { verifyFirebaseToken, verifyAdmin } = require('../config/firebase');

// Routes publiques
router.get('/', publiciteController.getAllPublicites);
router.get('/active', publiciteController.getActivePublicites);
router.get('/:id', publiciteController.getPubliciteById);

// Routes admin seulement
router.post('/', 
  verifyFirebaseToken,
  verifyAdmin,
  [
    body('titre').notEmpty().withMessage('Le titre est requis'),
    body('imageUrl').notEmpty().withMessage('L\'URL de l\'image est requise'),
    body('materialId').optional()
  ],
  publiciteController.createPublicite
);

router.put('/:id', 
  verifyFirebaseToken,
  verifyAdmin,
  publiciteController.updatePublicite
);

router.delete('/:id', 
  verifyFirebaseToken,
  verifyAdmin,
  publiciteController.deletePublicite
);

router.patch('/:id/activate', 
  verifyFirebaseToken,
  verifyAdmin,
  publiciteController.activatePublicite
);

router.patch('/:id/deactivate', 
  verifyFirebaseToken,
  verifyAdmin,
  publiciteController.deactivatePublicite
);

module.exports = router;