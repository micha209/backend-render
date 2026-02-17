const { firebaseDB } = require('../config/database');
const { validationResult } = require('express-validator');

// Chemin dans Firebase
const MATERIALS_PATH = 'materials';

/**
 * Récupérer tous les matériaux
 */
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await firebaseDB.get(MATERIALS_PATH);
    
    // Convertir l'objet en tableau
    const materialsArray = [];
    
    if (materials) {
      for (const key in materials) {
        materialsArray.push({
          id: key,
          ...materials[key]
        });
      }
    }
    
    // Support de la pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedMaterials = materialsArray.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: materialsArray.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(materialsArray.length / limit),
        hasNextPage: endIndex < materialsArray.length,
        hasPrevPage: startIndex > 0
      },
      data: paginatedMaterials
    });
  } catch (error) {
    console.error('Erreur getAllMaterials:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des matériaux',
      error: error.message
    });
  }
};

/**
 * Récupérer un matériau par ID
 */
exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const material = await firebaseDB.getById(MATERIALS_PATH, id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Matériau non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { id, ...material }
    });
  } catch (error) {
    console.error('Erreur getMaterialById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du matériau',
      error: error.message
    });
  }
};

/**
 * Créer un nouveau matériau
 */
exports.createMaterial = async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const materialData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Vérifier si le fournisseur existe
    if (materialData.fournisseurId) {
      const supplier = await firebaseDB.getById('fournisseur', materialData.fournisseurId);
      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: 'Le fournisseur spécifié n\'existe pas'
        });
      }
    }
    
    const newMaterial = await firebaseDB.create(MATERIALS_PATH, materialData);
    
    res.status(201).json({
      success: true,
      message: 'Matériau créé avec succès',
      data: newMaterial
    });
  } catch (error) {
    console.error('Erreur createMaterial:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du matériau',
      error: error.message
    });
  }
};

/**
 * Mettre à jour un matériau
 */
exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le matériau existe
    const existingMaterial = await firebaseDB.getById(MATERIALS_PATH, id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Matériau non trouvé'
      });
    }
    
    // Vérifier les droits (admin ou propriétaire du matériau)
    if (req.user) {
      const isAdmin = req.user.admin || false;
      const isOwner = existingMaterial.fournisseurId === req.supplierId;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier ce matériau'
        });
      }
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const updatedMaterial = await firebaseDB.update(MATERIALS_PATH, id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Matériau mis à jour avec succès',
      data: updatedMaterial
    });
  } catch (error) {
    console.error('Erreur updateMaterial:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du matériau',
      error: error.message
    });
  }
};

/**
 * Supprimer un matériau
 */
exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le matériau existe
    const existingMaterial = await firebaseDB.getById(MATERIALS_PATH, id);
    if (!existingMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Matériau non trouvé'
      });
    }
    
    // Vérifier les droits (admin seulement pour la suppression)
    if (req.user && !req.user.admin) {
      return res.status(403).json({
        success: false,
        message: 'Seul un admin peut supprimer un matériau'
      });
    }
    
    await firebaseDB.delete(MATERIALS_PATH, id);
    
    res.status(200).json({
      success: true,
      message: 'Matériau supprimé avec succès',
      data: { id }
    });
  } catch (error) {
    console.error('Erreur deleteMaterial:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du matériau',
      error: error.message
    });
  }
};

/**
 * Rechercher des matériaux
 */
exports.searchMaterials = async (req, res) => {
  try {
    const { q, type, supplier, minPrice, maxPrice, department } = req.query;
    
    const materials = await firebaseDB.get(MATERIALS_PATH);
    
    if (!materials) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Convertir en tableau et filtrer
    let materialsArray = [];
    
    for (const key in materials) {
      materialsArray.push({
        id: key,
        ...materials[key]
      });
    }
    
    // Appliquer les filtres
    if (q) {
      const searchTerm = q.toLowerCase();
      materialsArray = materialsArray.filter(m => 
        m.name?.toLowerCase().includes(searchTerm) || 
        m.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (type && type !== 'Tous') {
      materialsArray = materialsArray.filter(m => m.type === type);
    }
    
    if (supplier && supplier !== 'Tous') {
      materialsArray = materialsArray.filter(m => m.fournisseurId === supplier);
    }
    
    if (minPrice) {
      materialsArray = materialsArray.filter(m => m.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      materialsArray = materialsArray.filter(m => m.price <= parseFloat(maxPrice));
    }
    
    if (department && department !== 'Tous') {
      // Récupérer les fournisseurs pour filtrer par département
      const suppliers = await firebaseDB.get('fournisseur');
      const supplierIdsInDepartment = [];
      
      if (suppliers) {
        for (const key in suppliers) {
          if (suppliers[key].departement === department) {
            supplierIdsInDepartment.push(key);
          }
        }
      }
      
      materialsArray = materialsArray.filter(m => 
        supplierIdsInDepartment.includes(m.fournisseurId)
      );
    }
    
    res.status(200).json({
      success: true,
      count: materialsArray.length,
      data: materialsArray
    });
  } catch (error) {
    console.error('Erreur searchMaterials:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des matériaux',
      error: error.message
    });
  }
};

/**
 * Obtenir les statistiques des matériaux
 */
exports.getMaterialStats = async (req, res) => {
  try {
    const materials = await firebaseDB.get(MATERIALS_PATH);
    
    if (!materials) {
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          byType: {},
          priceRange: { min: 0, max: 0, avg: 0 },
          bySupplier: {}
        }
      });
    }
    
    const stats = {
      total: 0,
      byType: {},
      priceRange: { min: Infinity, max: -Infinity, avg: 0 },
      bySupplier: {},
      totalValue: 0
    };
    
    let totalPrice = 0;
    
    for (const key in materials) {
      const material = materials[key];
      stats.total++;
      
      // Par type
      if (material.type) {
        stats.byType[material.type] = (stats.byType[material.type] || 0) + 1;
      }
      
      // Par fournisseur
      if (material.fournisseurId) {
        stats.bySupplier[material.fournisseurId] = (stats.bySupplier[material.fournisseurId] || 0) + 1;
      }
      
      // Prix
      if (material.price) {
        stats.priceRange.min = Math.min(stats.priceRange.min, material.price);
        stats.priceRange.max = Math.max(stats.priceRange.max, material.price);
        totalPrice += material.price;
        
        // Valeur totale estimée (prix * stock)
        if (material.stock) {
          stats.totalValue += material.price * material.stock;
        }
      }
    }
    
    stats.priceRange.avg = stats.total > 0 ? totalPrice / stats.total : 0;
    
    if (stats.priceRange.min === Infinity) stats.priceRange.min = 0;
    if (stats.priceRange.max === -Infinity) stats.priceRange.max = 0;
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur getMaterialStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des statistiques',
      error: error.message
    });
  }
};

/**
 * Mettre à jour le stock d'un matériau
 */
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide'
      });
    }
    
    const material = await firebaseDB.getById(MATERIALS_PATH, id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Matériau non trouvé'
      });
    }
    
    let newStock = material.stock || 0;
    
    switch (operation) {
      case 'add':
        newStock += quantity;
        break;
      case 'remove':
        if (newStock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Stock insuffisant'
          });
        }
        newStock -= quantity;
        break;
      case 'set':
        newStock = quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Opération invalide'
        });
    }
    
    const updatedMaterial = await firebaseDB.update(MATERIALS_PATH, id, {
      stock: newStock,
      updatedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Stock mis à jour avec succès',
      data: {
        id,
        previousStock: material.stock || 0,
        newStock,
        operation
      }
    });
  } catch (error) {
    console.error('Erreur updateStock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du stock',
      error: error.message
    });
  }
};