import express from 'express';
import { TestController } from '../controllers/TestController.js';

const router = express.Router();
const testController = new TestController();

// GET /api/tests - Get all tests
router.get('/', testController.getTests);

// GET /api/tests/:id - Get a specific test
router.get('/:id', testController.getTest);

// POST /api/tests - Create a new test
router.post('/', testController.createTest);

// PUT /api/tests/:id - Update a test
router.put('/:id', testController.updateTest);

// DELETE /api/tests/:id - Delete a test
router.delete('/:id', testController.deleteTest);

// POST /api/tests/:id/submit - Submit test answers
router.post('/:id/submit', testController.submitTest);

// GET /api/tests/:id/results - Get test results
router.get('/:id/results', testController.getTestResults);

export default router;
