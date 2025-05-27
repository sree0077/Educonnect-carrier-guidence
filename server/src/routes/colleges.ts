import express from 'express';
import { CollegeController } from '../controllers/CollegeController.js';

const router = express.Router();
const collegeController = new CollegeController();

// GET /api/colleges - Get all colleges
router.get('/', collegeController.getColleges);

// GET /api/colleges/:id - Get a specific college
router.get('/:id', collegeController.getCollege);

// POST /api/colleges - Create a new college
router.post('/', collegeController.createCollege);

// PUT /api/colleges/:id - Update a college
router.put('/:id', collegeController.updateCollege);

// DELETE /api/colleges/:id - Delete a college
router.delete('/:id', collegeController.deleteCollege);

// GET /api/colleges/:id/courses - Get courses for a college
router.get('/:id/courses', collegeController.getCourses);

// POST /api/colleges/:id/courses - Add a course to a college
router.post('/:id/courses', collegeController.addCourse);

export default router;
