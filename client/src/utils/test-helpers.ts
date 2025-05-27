import { db } from '@config/firebase.config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { Question } from '@/types/question';

/**
 * Get questions for a specific aptitude test
 * @param testId The ID of the aptitude test
 * @returns Array of questions for the test
 */
export const getTestQuestions = async (testId: string): Promise<Question[]> => {
  try {
    // First get the test document to find the college ID and question IDs
    const testDoc = await getDoc(doc(db, 'aptitude_tests', testId));
    if (!testDoc.exists()) {
      throw new Error('Test not found');
    }

    const testData = testDoc.data();
    const collegeId = testData.college_id;
    const questionIds = testData.questions || [];

    if (!collegeId) {
      console.warn('Test is not associated with a college, using default questions');
      // If no college ID, try to use the questions directly from the test
      if (Array.isArray(questionIds) && questionIds.length > 0) {
        // Try to get questions from the main questions collection as fallback
        const questions: Question[] = [];
        for (const qId of questionIds) {
          try {
            const questionDoc = await getDoc(doc(db, 'questions', qId));
            if (questionDoc.exists()) {
              questions.push({ id: questionDoc.id, ...questionDoc.data() } as Question);
            }
          } catch (err) {
            console.error(`Error fetching question ${qId}:`, err);
          }
        }
        return questions;
      }
      return [];
    }

    // If no question IDs specified, return empty array
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      console.warn('No questions specified for this test');
      return [];
    }

    console.log(`Fetching questions for test ${testId} from college ${collegeId}, question IDs:`, questionIds);

    // Get all questions from the college's questions subcollection
    const questionsRef = collection(db, 'colleges', collegeId, 'questions');
    const questionsSnapshot = await getDocs(questionsRef);

    console.log(`Found ${questionsSnapshot.docs.length} questions in college subcollection`);

    // Filter to only include questions that are part of this test
    const questions = questionsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Question;
      })
      .filter(question => questionIds.includes(question.id));

    console.log(`After filtering, found ${questions.length} questions for this test`);

    if (questions.length === 0) {
      console.warn('No matching questions found in college subcollection');
    }

    return questions;
  } catch (error) {
    console.error('Error getting test questions:', error);
    throw error;
  }
};

/**
 * Save test results and update application status if needed
 * @param testId The ID of the aptitude test
 * @param studentId The ID of the student
 * @param answers The student's answers
 * @param applicationId The ID of the application (optional)
 * @returns The test result document
 */
export const saveTestResult = async (
  testId: string,
  studentId: string,
  answers: Record<string, any>,
  applicationId?: string
) => {
  try {
    // Get the test questions to calculate the score
    const questions = await getTestQuestions(testId);

    // Calculate the score
    let correctAnswers = 0;
    let totalQuestions = questions.length;

    questions.forEach(question => {
      const studentAnswer = answers[question.id];

      if (question.type === 'mcq-single') {
        // For single-choice questions, check if the selected option is correct
        const selectedOption = question.options.find(opt => opt.id === studentAnswer);
        if (selectedOption && selectedOption.isCorrect) {
          correctAnswers++;
        }
      } else if (question.type === 'mcq-multiple') {
        // For multiple-choice questions, all correct options must be selected and no incorrect ones
        const selectedOptions = Array.isArray(studentAnswer) ? studentAnswer : [];
        const correctOptionIds = question.options.filter(opt => opt.isCorrect).map(opt => opt.id);

        // Check if selected options match exactly with correct options
        if (selectedOptions.length === correctOptionIds.length &&
            selectedOptions.every(id => correctOptionIds.includes(id))) {
          correctAnswers++;
        }
      }
      // For other question types, manual grading would be needed
    });

    // Calculate percentage score
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Define the passing score (e.g., 60%)
    const passingScore = 60;
    const passed = score >= passingScore;

    // Save the test result
    const resultData = {
      test_id: testId,
      student_id: studentId,
      score,
      passed,
      answers,
      completed_at: Timestamp.now(),
      application_id: applicationId || null
    };

    const resultRef = await addDoc(collection(db, 'test_results'), resultData);
    console.log(`Test result saved with ID: ${resultRef.id}, score: ${score}, passed: ${passed}`);

    // If this test is linked to an application, update the application status based on the score
    let applicationUpdateResult = null;
    if (applicationId) {
      console.log(`Updating application ${applicationId} based on test result`);
      applicationUpdateResult = await updateApplicationBasedOnTestResult(applicationId, score);
    }

    return {
      id: resultRef.id,
      ...resultData,
      applicationUpdateResult
    };
  } catch (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
};

/**
 * Update application status based on test result
 * @param applicationId The ID of the application
 * @param score The test score (percentage)
 */
export const updateApplicationBasedOnTestResult = async (applicationId: string, score: number) => {
  try {
    console.log(`Updating application ${applicationId} based on test score: ${score}`);

    // First, we need to find which student this application belongs to
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);

    let applicationRef;
    let applicationDoc;
    let studentId;
    let found = false;

    console.log(`Searching for application ${applicationId} in ${studentsSnapshot.docs.length} student documents`);

    // Search through all students to find the application
    for (const studentDoc of studentsSnapshot.docs) {
      studentId = studentDoc.id;
      console.log(`Checking student ${studentId} for application ${applicationId}`);

      try {
        const tempAppRef = doc(db, 'students', studentId, 'applications', applicationId);
        const tempAppDoc = await getDoc(tempAppRef);

        if (tempAppDoc.exists()) {
          applicationRef = tempAppRef;
          applicationDoc = tempAppDoc;
          found = true;
          console.log(`Found application ${applicationId} in student ${studentId}`);
          break;
        }
      } catch (err) {
        console.error(`Error checking application in student ${studentId}:`, err);
      }
    }

    // If we didn't find the application in any student's subcollection
    if (!found || !applicationDoc || !applicationRef) {
      console.error(`Application ${applicationId} not found in any student subcollection`);
      throw new Error('Application not found in any student subcollection');
    }

    const applicationData = applicationDoc.data();
    console.log('Current application data:', applicationData);

    // Define the passing score (e.g., 60%)
    const passingScore = 60;

    // Determine if the test was passed or failed
    const testPassed = score >= passingScore;

    // Always set to declined if failed, regardless of current status
    const newStatus = testPassed ? applicationData.status : 'declined';

    console.log(`Test ${testPassed ? 'passed' : 'failed'}. New status: ${newStatus}`);

    // Check if the application already has test results
    if (applicationData.test_result) {
      console.log('Application already has test results:', applicationData.test_result);
    }

    // Prepare the update data
    const updateData = {
      test_result: {
        score,
        completed_at: Timestamp.now(),
        passed: testPassed
      },
      // If the student failed the test, change status to declined
      status: newStatus,
      updated_at: Timestamp.now()
    };

    console.log(`Updating application ${applicationId} with data:`, updateData);

    try {
      // Update the application with the test result
      await updateDoc(applicationRef, updateData);
      console.log(`Application ${applicationId} updated successfully with status: ${newStatus}`);

      // Double-check that the update was successful
      const updatedAppDoc = await getDoc(applicationRef);
      if (updatedAppDoc.exists()) {
        const updatedData = updatedAppDoc.data();
        console.log(`Verified updated application data:`, updatedData);

        // If the status wasn't updated correctly, try again with a direct status update
        if (updatedData.status !== newStatus && !testPassed) {
          console.log(`Status wasn't updated correctly. Trying direct status update to 'declined'`);
          await updateDoc(applicationRef, {
            status: 'declined',
            updated_at: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error(`Error updating application ${applicationId}:`, error);
      throw error;
    }

    // Return the updated application data for reference
    return {
      applicationId,
      studentId,
      previousStatus: applicationData.status,
      newStatus,
      testPassed,
      updateData
    };
  } catch (error) {
    console.error('Error updating application based on test result:', error);
    throw error;
  }
};

/**
 * Get pending aptitude tests for a student based on approved applications
 * @param studentId The ID of the student
 * @returns Array of tests that need to be taken
 */
export const getPendingTestsForStudent = async (studentId: string) => {
  try {
    // Get approved applications from student's subcollection
    const applicationsRef = collection(db, 'students', studentId, 'applications');
    const applicationsQuery = query(
      applicationsRef,
      where('status', '==', 'approved')
    );

    const applicationsSnapshot = await getDocs(applicationsQuery);

    // Get completed tests for this student
    const resultsQuery = query(
      collection(db, 'test_results'),
      where('student_id', '==', studentId)
    );

    const resultsSnapshot = await getDocs(resultsQuery);
    console.log(`Found ${resultsSnapshot.docs.length} test results for student ${studentId}`);

    // Log all test results for debugging
    resultsSnapshot.docs.forEach(doc => {
      console.log('Test result:', doc.id, doc.data());
    });

    const completedTestIds = resultsSnapshot.docs.map(doc => doc.data().test_id);
    console.log('Completed test IDs:', completedTestIds);

    // Also get the application IDs for completed tests
    const completedApplicationIds = resultsSnapshot.docs
      .filter(doc => doc.data().application_id)
      .map(doc => doc.data().application_id);

    console.log('Completed application IDs:', completedApplicationIds);

    // For each approved application, check if there's an aptitude test to take
    const pendingTests = [];

    console.log(`Found ${applicationsSnapshot.docs.length} approved applications for student ${studentId}`);

    for (const appDoc of applicationsSnapshot.docs) {
      const appData = appDoc.data();
      const applicationId = appDoc.id;

      console.log(`Checking application ${applicationId}:`, appData);

      // Skip applications that already have test results in the application document
      if (appData.test_result) {
        console.log(`Skipping application ${applicationId} - already has test results in application document:`, appData.test_result);
        continue;
      }

      // Skip applications whose IDs are in the completedApplicationIds list from test_results collection
      if (completedApplicationIds.includes(applicationId)) {
        console.log(`Skipping application ${applicationId} - found in completed test results collection`);
        continue;
      }

      // Skip applications that don't have an aptitude test assigned
      if (!appData.aptitude_test_id) {
        console.log(`Skipping application ${applicationId} - no aptitude test assigned`);
        continue;
      }

      // Skip if the test has already been completed (check by test ID)
      if (completedTestIds.includes(appData.aptitude_test_id)) {
        console.log(`Skipping application ${applicationId} - test ${appData.aptitude_test_id} already completed`);
        continue;
      }

      // Check if the application has an aptitude test requirement
      if (appData.aptitude_test_id && !completedTestIds.includes(appData.aptitude_test_id)) {
        // Get the test details
        const testDoc = await getDoc(doc(db, 'aptitude_tests', appData.aptitude_test_id));
        if (testDoc.exists()) {
          const testData = testDoc.data();

          // Get college name
          let collegeName = 'Unknown College';
          const collegeDoc = await getDoc(doc(db, 'colleges', appData.college_id));
          if (collegeDoc.exists()) {
            collegeName = collegeDoc.data().name || 'Unknown College';
          }

          pendingTests.push({
            id: testDoc.id,
            title: testData.title || 'Aptitude Test',
            description: testData.description || '',
            application_id: applicationId,
            college_name: collegeName,
            isRequired: true
          });

          console.log('Found pending test for application:', {
            testId: testDoc.id,
            applicationId,
            collegeName
          });
        }
      }
    }

    return pendingTests;
  } catch (error) {
    console.error('Error getting pending tests for student:', error);
    throw error;
  }
};
