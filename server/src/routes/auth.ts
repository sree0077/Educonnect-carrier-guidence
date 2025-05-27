import express from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = express.Router();
const authController = new AuthController();

// POST /api/auth/login - User login
router.post('/login', authController.login);

// POST /api/auth/register/student - Student registration
router.post('/register/student', authController.registerStudent);

// POST /api/auth/register/college - College registration
router.post('/register/college', authController.registerCollege);

// POST /api/auth/logout - User logout
router.post('/logout', authController.logout);

// GET /api/auth/verify - Verify token
router.get('/verify', authController.verifyToken);

export default router;
