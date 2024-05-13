import express, { Router } from 'express';
import { getAllProducts, createProduct } from '../controllers/productController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', getAllProducts);
router.post('/', authenticateUser, createProduct);
// Add other routes for updating, deleting products, etc.

export default router;