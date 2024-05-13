import express, { Router } from 'express';
import bodyParser from 'body-parser';
import { register, login } from '../controllers/authController.js';
const router = Router();
router.use(bodyParser.json())
router.get('/d', (req, res) => res.send('Hello World!'))
router.post('/register', register);
router.post('/login', login);

export default router;