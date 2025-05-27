import { FirebaseService } from './FirebaseService.js';

export class QuestionService {
  private firebaseService: FirebaseService;

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  async getQuestions(collegeId?: string) {
    try {
      if (collegeId) {
        return await this.firebaseService.getQuestions(collegeId);
      } else {
        return await this.firebaseService.getAllCollegesQuestions();
      }
    } catch (error) {
      console.error('Error in QuestionService.getQuestions:', error);
      throw error;
    }
  }

  async getQuestion(id: string, collegeId?: string) {
    try {
      return await this.firebaseService.getQuestion(id, collegeId);
    } catch (error) {
      console.error('Error in QuestionService.getQuestion:', error);
      throw error;
    }
  }

  async createQuestion(questionData: any) {
    try {
      return await this.firebaseService.saveQuestion(questionData);
    } catch (error) {
      console.error('Error in QuestionService.createQuestion:', error);
      throw error;
    }
  }

  async updateQuestion(id: string, questionData: any) {
    try {
      return await this.firebaseService.updateQuestion(id, questionData);
    } catch (error) {
      console.error('Error in QuestionService.updateQuestion:', error);
      throw error;
    }
  }

  async deleteQuestion(id: string, collegeId?: string) {
    try {
      return await this.firebaseService.deleteQuestion(id, collegeId);
    } catch (error) {
      console.error('Error in QuestionService.deleteQuestion:', error);
      throw error;
    }
  }

  async bulkUploadQuestions(questions: any[], collegeId?: string) {
    try {
      return await this.firebaseService.bulkUploadQuestions(questions, collegeId);
    } catch (error) {
      console.error('Error in QuestionService.bulkUploadQuestions:', error);
      throw error;
    }
  }
}
