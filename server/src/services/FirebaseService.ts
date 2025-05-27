import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export class FirebaseService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    if (!admin.apps.length) {
      // Initialize Firebase Admin SDK
      // In production, use service account key
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'carrier-guidence-da33f'
      });
    }
    this.db = getFirestore();
  }

  // Helper function to get the current college ID
  getCurrentCollegeId(): string {
    // For development, use a default college ID
    return process.env.DEFAULT_COLLEGE_ID || 'carrier-guidence-da33f';
  }

  // Ensure college document exists
  async ensureCollegeExists(collegeId: string) {
    try {
      const collegeRef = this.db.collection('colleges').doc(collegeId);
      const collegeDoc = await collegeRef.get();

      if (!collegeDoc.exists) {
        await collegeRef.set({
          id: collegeId,
          name: `College ${collegeId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Created college document for ID: ${collegeId}`);
      }
    } catch (error) {
      console.error('Error ensuring college exists:', error);
      throw error;
    }
  }

  // Save a question to Firebase
  async saveQuestion(questionData: any, collegeId?: string) {
    try {
      const targetCollegeId = collegeId || this.getCurrentCollegeId();
      await this.ensureCollegeExists(targetCollegeId);

      const questionsCollectionRef = this.db
        .collection('colleges')
        .doc(targetCollegeId)
        .collection('questions');

      const preparedQuestion = {
        ...questionData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await questionsCollectionRef.add(preparedQuestion);
      console.log(`Question saved with ID: ${docRef.id} to college: ${targetCollegeId}`);

      return {
        id: docRef.id,
        ...preparedQuestion
      };
    } catch (error) {
      console.error('Error saving question to Firebase:', error);
      throw error;
    }
  }

  // Get questions for a specific college
  async getQuestions(collegeId?: string) {
    try {
      const targetCollegeId = collegeId || this.getCurrentCollegeId();
      const questionsCollectionRef = this.db
        .collection('colleges')
        .doc(targetCollegeId)
        .collection('questions');

      const querySnapshot = await questionsCollectionRef.get();
      const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Retrieved ${questions.length} questions from college: ${targetCollegeId}`);
      return questions;
    } catch (error) {
      console.error('Error getting questions from Firebase:', error);
      throw error;
    }
  }

  // Get all questions across all colleges
  async getAllCollegesQuestions() {
    try {
      const questionsQuery = this.db.collectionGroup('questions');
      const querySnapshot = await questionsQuery.get();

      const questions = querySnapshot.docs.map(doc => {
        const pathSegments = doc.ref.path.split('/');
        const collegeId = pathSegments[1];

        return {
          id: doc.id,
          collegeId,
          ...doc.data()
        };
      });

      console.log(`Retrieved ${questions.length} questions from all colleges`);
      return questions;
    } catch (error) {
      console.error('Error getting all questions from Firebase:', error);
      throw error;
    }
  }

  // Get a specific question
  async getQuestion(id: string, collegeId?: string) {
    try {
      const targetCollegeId = collegeId || this.getCurrentCollegeId();
      const questionRef = this.db
        .collection('colleges')
        .doc(targetCollegeId)
        .collection('questions')
        .doc(id);

      const doc = await questionRef.get();
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting question from Firebase:', error);
      throw error;
    }
  }

  // Update a question
  async updateQuestion(id: string, questionData: any, collegeId?: string) {
    try {
      const targetCollegeId = collegeId || this.getCurrentCollegeId();
      const questionRef = this.db
        .collection('colleges')
        .doc(targetCollegeId)
        .collection('questions')
        .doc(id);

      const updateData = {
        ...questionData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await questionRef.update(updateData);
      console.log(`Question updated with ID: ${id} in college: ${targetCollegeId}`);

      return {
        id,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating question in Firebase:', error);
      throw error;
    }
  }

  // Delete a question
  async deleteQuestion(id: string, collegeId?: string) {
    try {
      const targetCollegeId = collegeId || this.getCurrentCollegeId();
      const questionRef = this.db
        .collection('colleges')
        .doc(targetCollegeId)
        .collection('questions')
        .doc(id);

      await questionRef.delete();
      console.log(`Question deleted with ID: ${id} from college: ${targetCollegeId}`);
    } catch (error) {
      console.error('Error deleting question from Firebase:', error);
      throw error;
    }
  }

  // Bulk upload questions
  async bulkUploadQuestions(questions: any[], collegeId?: string) {
    try {
      const targetCollegeId = collegeId || this.getCurrentCollegeId();
      await this.ensureCollegeExists(targetCollegeId);

      const batch = this.db.batch();
      const results = {
        total: questions.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const questionData of questions) {
        try {
          const preparedQuestion = {
            ...questionData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          const newQuestionRef = this.db
            .collection('colleges')
            .doc(targetCollegeId)
            .collection('questions')
            .doc();

          batch.set(newQuestionRef, preparedQuestion);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing question: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      await batch.commit();
      console.log(`Bulk upload to college ${targetCollegeId} completed:`, results);
      return results;
    } catch (error) {
      console.error('Error in bulk upload to Firebase:', error);
      throw error;
    }
  }
}
