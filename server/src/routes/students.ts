import express from 'express';
import { StudentController } from '../controllers/StudentController.js';

const router = express.Router();
const studentController = new StudentController();

// GET /api/students - Get all students
router.get('/', studentController.getStudents);

// GET /api/students/:id - Get a specific student
router.get('/:id', studentController.getStudent);

// PUT /api/students/:id - Update a student
router.put('/:id', studentController.updateStudent);

// DELETE /api/students/:id - Delete a student
router.delete('/:id', studentController.deleteStudent);

// GET /api/students/:id/applications - Get student applications
router.get('/:id/applications', studentController.getApplications);

// POST /api/students/:id/applications - Create a new application
router.post('/:id/applications', studentController.createApplication);

export default router;
