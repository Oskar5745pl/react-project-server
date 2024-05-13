
import express, { Router } from 'express';
import { createOrder } from '../controllers/orderController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
const router = Router();
router.post('/', authenticateUser, createOrder);
// Add other routes for getting order history, updating orders, etc.
export default router;