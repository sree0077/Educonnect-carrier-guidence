import express from 'express';
import { QuestionController } from '../controllers/QuestionController.js';

const router = express.Router();
const questionController = new QuestionController();

// GET /api/questions - Get all questions for a college
router.get('/', questionController.getQuestions);

// GET /api/questions/:id - Get a specific question
router.get('/:id', questionController.getQuestion);

// POST /api/questions - Create a new question
router.post('/', questionController.createQuestion);

// PUT /api/questions/:id - Update a question
router.put('/:id', questionController.updateQuestion);

// DELETE /api/questions/:id - Delete a question
router.delete('/:id', questionController.deleteQuestion);

// POST /api/questions/bulk - Bulk upload questions
router.post('/bulk', questionController.bulkUploadQuestions);

export default router;
