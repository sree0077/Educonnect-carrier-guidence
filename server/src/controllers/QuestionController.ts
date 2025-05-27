import { Request, Response } from 'express';
import { QuestionService } from '../services/QuestionService.js';

export class QuestionController {
  private questionService: QuestionService;

  constructor() {
    this.questionService = new QuestionService();
  }

  getQuestions = async (req: Request, res: Response) => {
    try {
      const { collegeId } = req.query;
      const questions = await this.questionService.getQuestions(collegeId as string);
      res.json(questions);
    } catch (error) {
      console.error('Error getting questions:', error);
      res.status(500).json({ error: 'Failed to get questions' });
    }
  };

  getQuestion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { collegeId } = req.query;
      const question = await this.questionService.getQuestion(id, collegeId as string);
      
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      res.json(question);
    } catch (error) {
      console.error('Error getting question:', error);
      res.status(500).json({ error: 'Failed to get question' });
    }
  };

  createQuestion = async (req: Request, res: Response) => {
    try {
      const questionData = req.body;
      const question = await this.questionService.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ error: 'Failed to create question' });
    }
  };

  updateQuestion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const questionData = req.body;
      const question = await this.questionService.updateQuestion(id, questionData);
      res.json(question);
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ error: 'Failed to update question' });
    }
  };

  deleteQuestion = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { collegeId } = req.query;
      await this.questionService.deleteQuestion(id, collegeId as string);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  };

  bulkUploadQuestions = async (req: Request, res: Response) => {
    try {
      const { questions, collegeId } = req.body;
      const result = await this.questionService.bulkUploadQuestions(questions, collegeId);
      res.json(result);
    } catch (error) {
      console.error('Error bulk uploading questions:', error);
      res.status(500).json({ error: 'Failed to bulk upload questions' });
    }
  };
}
