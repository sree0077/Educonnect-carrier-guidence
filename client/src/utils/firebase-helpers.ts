import { db } from '@config/firebase.config';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, collectionGroup, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { Question } from '@/types/question';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get the current college ID
// This should be replaced with your actual method of getting the college ID
export const getCurrentCollegeId = (): string => {
  // Try to get from localStorage
  const collegeId = localStorage.getItem('currentCollegeId');

  // If not found, use a default (for development)
  if (!collegeId) {
    // For development, you might want to set a default college ID
    // Using the actual project ID from Firebase to ensure it exists
    const defaultCollegeId = 'carrier-guidence-da33f';
    localStorage.setItem('currentCollegeId', defaultCollegeId);
    return defaultCollegeId;
  }

  return collegeId;
};

/**
 * Ensure that a college document exists in Firestore
 * @param collegeId The ID of the college to ensure exists
 * @returns Promise that resolves when the college document exists
 */
export const ensureCollegeExists = async (collegeId: string): Promise<void> => {
  try {
    // Get a reference to the college document
    const collegeRef = doc(db, 'colleges', collegeId);

    // Check if the document exists
    const collegeDoc = await getDoc(collegeRef);

    // If it doesn't exist, create it
    if (!collegeDoc.exists()) {
      console.log(`College document ${collegeId} doesn't exist, creating it...`);
      await setDoc(collegeRef, {
        id: collegeId,
        name: `College ${collegeId}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      console.log(`College document ${collegeId} created successfully`);
    }
  } catch (error) {
    console.error(`Error ensuring college ${collegeId} exists:`, error);
    throw error;
  }
};

/**
 * Save a question to Firebase as a subcollection of a college
 * @param questionData The question data to save
 * @param collegeId The ID of the college (optional, will use current college if not provided)
 * @returns The document reference
 */
export const saveQuestion = async (questionData: Question, collegeId?: string) => {
  try {
    // Use provided collegeId or get the current one
    const targetCollegeId = collegeId || getCurrentCollegeId();

    // Ensure the college document exists
    await ensureCollegeExists(targetCollegeId);

    // Create a reference to the questions subcollection within the college document
    const questionsCollectionRef = collection(db, 'colleges', targetCollegeId, 'questions');

    // Add the document to the subcollection
    const docRef = await addDoc(questionsCollectionRef, questionData);
    console.log(`Question saved to college ${targetCollegeId} with ID:`, docRef.id);
    return docRef;
  } catch (error) {
    console.error('Error saving question to Firebase:', error);
    throw error;
  }
};

/**
 * Get all questions for a specific college from Firebase
 * @param collegeId The ID of the college (optional, will use current college if not provided)
 * @returns Array of questions
 */
export const getQuestions = async (collegeId?: string) => {
  try {
    // Use provided collegeId or get the current one
    const targetCollegeId = collegeId || getCurrentCollegeId();

    // Ensure the college document exists
    await ensureCollegeExists(targetCollegeId);

    // Get the questions subcollection for this college
    const questionsCollectionRef = collection(db, 'colleges', targetCollegeId, 'questions');
    const querySnapshot = await getDocs(questionsCollectionRef);

    const questions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return questions;
  } catch (error) {
    console.error('Error getting questions from Firebase:', error);
    throw error;
  }
};

/**
 * Get all questions across all colleges (admin function)
 * @returns Array of questions with collegeId
 */
export const getAllCollegesQuestions = async () => {
  try {
    // Use collectionGroup to query across all 'questions' subcollections
    const questionsQuery = query(collectionGroup(db, 'questions'));
    const querySnapshot = await getDocs(questionsQuery);

    const questions = querySnapshot.docs.map(doc => {
      // The path will be 'colleges/{collegeId}/questions/{questionId}'
      const pathSegments = doc.ref.path.split('/');
      const collegeId = pathSegments[1]; // The college ID is the second segment

      return {
        id: doc.id,
        collegeId,
        ...doc.data()
      };
    });

    return questions;
  } catch (error) {
    console.error('Error getting all colleges questions from Firebase:', error);
    throw error;
  }
};

/**
 * Get questions by category for a specific college
 * @param category The category to filter by
 * @param collegeId The ID of the college (optional, will use current college if not provided)
 * @returns Array of questions in the category
 */
export const getQuestionsByCategory = async (category: string, collegeId?: string) => {
  try {
    // Use provided collegeId or get the current one
    const targetCollegeId = collegeId || getCurrentCollegeId();

    // Get the questions subcollection for this college
    const questionsCollectionRef = collection(db, 'colleges', targetCollegeId, 'questions');

    // Create a query to filter by category
    const q = query(questionsCollectionRef, where('categories', 'array-contains', category));
    const querySnapshot = await getDocs(q);

    const questions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return questions;
  } catch (error) {
    console.error('Error getting questions by category from Firebase:', error);
    throw error;
  }
};

/**
 * Update a question in Firebase
 * @param questionId The ID of the question to update (Firestore document ID)
 * @param questionData The updated question data
 * @param collegeId The ID of the college (optional, will use current college if not provided)
 */
export const updateQuestion = async (questionId: string, questionData: Partial<Question>, collegeId?: string) => {
  try {
    // Use provided collegeId or get the current one
    const targetCollegeId = collegeId || getCurrentCollegeId();

    // Ensure the college document exists
    await ensureCollegeExists(targetCollegeId);

    // Get a reference to the document in Firestore
    const questionRef = doc(db, 'colleges', targetCollegeId, 'questions', questionId);

    // Remove any fields that Firestore doesn't like
    const { id, ...dataToUpdate } = questionData as any;

    // Update the document
    await updateDoc(questionRef, {
      ...dataToUpdate,
      updatedAt: Date.now()
    });

    console.log(`Question updated in college ${targetCollegeId} with ID:`, questionId);
  } catch (error) {
    console.error('Error updating question in Firebase:', error);
    throw error;
  }
};

/**
 * Delete a question from Firebase
 * @param questionId The ID of the question to delete
 * @param collegeId The ID of the college (optional, will use current college if not provided)
 */
export const deleteQuestion = async (questionId: string, collegeId?: string) => {
  try {
    // Use provided collegeId or get the current one
    const targetCollegeId = collegeId || getCurrentCollegeId();

    // Ensure the college document exists
    await ensureCollegeExists(targetCollegeId);

    // Get a reference to the document in Firestore
    const questionRef = doc(db, 'colleges', targetCollegeId, 'questions', questionId);

    // Delete the document
    await deleteDoc(questionRef);
    console.log(`Question deleted from college ${targetCollegeId} with ID:`, questionId);
  } catch (error) {
    console.error('Error deleting question from Firebase:', error);
    throw error;
  }
};

/**
 * Upload multiple questions in bulk to a college's subcollection
 * @param questions Array of question data to upload
 * @param collegeId The ID of the college (optional, will use current college if not provided)
 * @returns Object with counts of successful and failed uploads
 */
export const bulkUploadQuestions = async (questions: Partial<Question>[], collegeId?: string) => {
  try {
    // Use provided collegeId or get the current one
    const targetCollegeId = collegeId || getCurrentCollegeId();

    // Ensure the college document exists
    await ensureCollegeExists(targetCollegeId);

    // Create a batch for efficient writes
    const batch = writeBatch(db);

    // Track results
    const results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each question
    for (const questionData of questions) {
      try {
        // Validate the question data
        if (!questionData.text || !questionData.type) {
          throw new Error(`Invalid question data: Missing required fields`);
        }

        // Prepare the question data with required fields
        const preparedQuestion = {
          ...questionData,
          id: questionData.id || uuidv4(),
          createdAt: Date.now(), // Always set current timestamp
          updatedAt: Date.now()  // Always set current timestamp
        };

        // Create a reference to a new document in the questions subcollection
        const newQuestionRef = doc(collection(db, 'colleges', targetCollegeId, 'questions'));

        // Add the document to the batch
        batch.set(newQuestionRef, preparedQuestion);

        // Increment successful count
        results.successful++;
      } catch (error) {
        // Track failed questions
        results.failed++;
        results.errors.push(`Error processing question: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Commit the batch
    await batch.commit();

    console.log(`Bulk upload to college ${targetCollegeId} completed:`, results);
    return results;
  } catch (error) {
    console.error('Error in bulk upload to Firebase:', error);
    throw error;
  }
};

/**
 * Parse a JSON string into an array of questions
 * @param jsonString The JSON string to parse
 * @returns Array of question objects
 */
export const parseQuestionsJson = (jsonString: string): Partial<Question>[] => {
  try {
    const parsed = JSON.parse(jsonString);

    // Handle both array and object formats
    const questions = Array.isArray(parsed) ? parsed : [parsed];

    // Validate the questions
    return questions.map(q => {
      // Ensure each question has the required fields
      if (!q.text || !q.type) {
        console.warn('Question missing required fields:', q);
      }

      return q;
    });
  } catch (error) {
    console.error('Error parsing questions JSON:', error);
    throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Add questions to an aptitude test
 * @param testId The ID of the aptitude test
 * @param questionIds Array of question IDs to add to the test
 * @returns Promise that resolves when the questions are added
 */
export const addQuestionsToTest = async (testId: string, questionIds: string[]) => {
  try {
    // Get a reference to the aptitude test document
    const testRef = doc(db, 'aptitude_tests', testId);

    // Get the current test data
    const testDoc = await getDoc(testRef);
    if (!testDoc.exists()) {
      throw new Error(`Aptitude test with ID ${testId} not found`);
    }

    // Get the current questions array or initialize it
    const testData = testDoc.data();
    const currentQuestions = Array.isArray(testData.questions) ? testData.questions : [];

    // Add the new question IDs, avoiding duplicates
    const updatedQuestions = [...new Set([...currentQuestions, ...questionIds])];

    // Update the test document
    await updateDoc(testRef, {
      questions: updatedQuestions,
      updatedAt: Date.now()
    });

    console.log(`Added ${questionIds.length} questions to aptitude test ${testId}`);
    return updatedQuestions;
  } catch (error) {
    console.error('Error adding questions to aptitude test:', error);
    throw error;
  }
};

/**
 * Remove questions from an aptitude test
 * @param testId The ID of the aptitude test
 * @param questionIds Array of question IDs to remove from the test
 * @returns Promise that resolves when the questions are removed
 */
export const removeQuestionsFromTest = async (testId: string, questionIds: string[]) => {
  try {
    // Get a reference to the aptitude test document
    const testRef = doc(db, 'aptitude_tests', testId);

    // Get the current test data
    const testDoc = await getDoc(testRef);
    if (!testDoc.exists()) {
      throw new Error(`Aptitude test with ID ${testId} not found`);
    }

    // Get the current questions array
    const testData = testDoc.data();
    const currentQuestions = Array.isArray(testData.questions) ? testData.questions : [];

    // Remove the specified question IDs
    const updatedQuestions = currentQuestions.filter(id => !questionIds.includes(id));

    // Update the test document
    await updateDoc(testRef, {
      questions: updatedQuestions,
      updatedAt: Date.now()
    });

    console.log(`Removed ${questionIds.length} questions from aptitude test ${testId}`);
    return updatedQuestions;
  } catch (error) {
    console.error('Error removing questions from aptitude test:', error);
    throw error;
  }
};
