import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, Clock, School } from 'lucide-react';
import { auth, db } from '@config/firebase.config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getPendingTestsForStudent } from '@/utils/test-helpers';

type Test = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  application_id?: string;
  college_name?: string;
  isRequired?: boolean;
  score?: number;
  result_id?: string;
};

const AptitudeTestList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResultsMap, setTestResultsMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Get all aptitude tests
        const testsSnapshot = await getDocs(collection(db, 'aptitude_tests'));
        const testsData = testsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Test));
        if (testsData.length === 0) {
          console.warn('No aptitude tests found in Firestore.');
          toast({
            title: 'No Tests Found',
            description: 'No aptitude tests are available in the database. Please ask an admin to add some.',
            variant: 'destructive'
          });
        } else {
          console.log('Fetched aptitude tests:', testsData);
        }
        // Get student document by profile_id
        const studentsRef = collection(db, 'students');
        const studentQuery = query(studentsRef, where('profile_id', '==', user.uid));
        const studentSnapshot = await getDocs(studentQuery);
        let studentId = null;
        if (!studentSnapshot.empty) {
          studentId = studentSnapshot.docs[0].id;
        } else {
          console.warn('No student profile found for user:', user.uid);
          toast({
            title: 'Profile Missing',
            description: 'No student profile found. Please complete your profile first.',
            variant: 'destructive'
          });
        }
        let completedTestIds: string[] = [];
        if (studentId) {
          // Get completed tests with their scores
          const resultsQuery = query(collection(db, 'test_results'), where('student_id', '==', studentId));
          const resultsSnapshot = await getDocs(resultsQuery);

          // Create a map of test results for easy lookup
          const newTestResultsMap = new Map();
          resultsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            newTestResultsMap.set(data.test_id, {
              score: data.score,
              result_id: doc.id,
              completed_at: data.completed_at
            });
          });

          // Update the state with the test results map
          setTestResultsMap(newTestResultsMap);

          completedTestIds = Array.from(newTestResultsMap.keys());
          console.log('Completed test IDs:', completedTestIds);
          console.log('Test results:', newTestResultsMap);
        }
        // Get tests required for approved applications
        let requiredTests: Test[] = [];
        if (studentId) {
          requiredTests = await getPendingTestsForStudent(studentId);
          console.log('Required tests from applications:', requiredTests);
        }

        // Combine general tests and application-required tests
        // For tests that appear in both lists, prioritize the application-required version
        const allTestsMap = new Map();

        console.log('Processing tests for student dashboard...');

        // First, add general tests (non-application specific tests)
        // Show all general tests, even completed ones
        testsData.forEach(test => {
          const isCompleted = completedTestIds.includes(test.id);
          console.log(`General test ${test.id} (${test.title || 'Untitled Test'}): completed = ${isCompleted}`);

          // Add test result data if available
          const testResult = testResultsMap.get(test.id);

          allTestsMap.set(test.id, {
            ...test,
            title: test.title || 'Untitled Test',
            description: test.description || '',
            completed: isCompleted,
            isRequired: false,
            score: testResult?.score,
            result_id: testResult?.result_id
          });
        });

        // Then process application-required tests
        // For required tests, only show them if they haven't been completed
        requiredTests.forEach(test => {
          const isCompleted = completedTestIds.includes(test.id);
          console.log(`Required test ${test.id} (${test.title}) for application ${test.application_id}: completed = ${isCompleted}`);

          // If this is a required test and it's already completed, don't show it
          // This prevents completed required tests from showing in the student dashboard
          if (isCompleted) {
            console.log(`Removing completed required test ${test.id} from dashboard`);

            // If it's already in the map as a general test, remove it
            if (allTestsMap.has(test.id)) {
              console.log(`Deleting test ${test.id} from dashboard display`);
              allTestsMap.delete(test.id);
            }
          } else {
            // Only add uncompleted required tests
            console.log(`Adding required test ${test.id} to dashboard`);
            allTestsMap.set(test.id, {
              ...test,
              completed: false, // Should always be false here
              isRequired: true
            });
          }
        });

        console.log(`Final dashboard will show ${allTestsMap.size} tests`);

        // Convert map back to array
        const formattedTests = Array.from(allTestsMap.values());
        setTests(formattedTests);
      } catch (error: any) {
        console.error('Error fetching tests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load aptitude tests',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [toast]);

  const handleStartTest = (test: Test) => {
    // If this test is required for an application, include the application ID in the URL
    if (test.application_id) {
      navigate(`/test/${test.id}?applicationId=${test.application_id}`);
    } else {
      navigate(`/test/${test.id}`);
    }
  };

  const handleViewResults = async (test: Test) => {
    try {
      console.log(`Finding results for test ${test.id}`);

      // Get the student ID first
      const studentQuery = query(
        collection(db, 'students'),
        where('profile_id', '==', auth.currentUser?.uid)
      );
      const studentSnapshot = await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        console.error('No student profile found');
        toast({
          title: 'Profile Missing',
          description: 'No student profile found. Please complete your profile first.',
          variant: 'destructive'
        });
        return;
      }

      const studentId = studentSnapshot.docs[0].id;
      console.log(`Found student ID: ${studentId}`);

      // Query test_results collection to find the specific result for this test and student
      const resultsQuery = query(
        collection(db, 'test_results'),
        where('test_id', '==', test.id),
        where('student_id', '==', studentId)
      );

      const resultsSnapshot = await getDocs(resultsQuery);

      if (resultsSnapshot.empty) {
        console.error(`No test results found for test ${test.id} and student ${studentId}`);
        toast({
          title: 'Results Not Found',
          description: 'We could not find your test results. Please try again later.',
          variant: 'destructive'
        });
        return;
      }

      // Get the first (and hopefully only) result document
      const resultDoc = resultsSnapshot.docs[0];
      const resultId = resultDoc.id;
      const resultData = resultDoc.data();

      console.log(`Found test result with ID ${resultId}:`, resultData);

      // Navigate to the test results page with the correct result ID
      navigate(`/test/results/${resultId}`);
    } catch (error) {
      console.error('Error finding test results:', error);
      toast({
        title: 'Error',
        description: 'Failed to retrieve test results',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Loading aptitude tests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No aptitude tests available yet</p>
          </CardContent>
        </Card>
      ) : (
        tests.map(test => (
          <Card
            key={test.id}
            className={`${test.completed ? "border-green-200" : ""} ${test.isRequired ? "border-amber-200" : ""}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
                {test.title}
                {test.completed && (
                  <div className="flex items-center ml-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <Check className="mr-1 h-3 w-3" />
                      Completed
                    </span>
                    {test.score !== undefined && (
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        test.score >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Score: {test.score}%
                      </span>
                    )}
                  </div>
                )}
                {test.isRequired && !test.completed && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Required
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {test.description}
                {test.college_name && (
                  <div className="mt-1 text-xs flex items-center">
                    <School className="mr-1 h-3 w-3" />
                    Required by {test.college_name}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="mr-1 h-4 w-4" />
                <span>30 minutes</span>
              </div>
            </CardContent>
            <CardFooter>
              {test.completed ? (
                <Button
                  variant="outline"
                  onClick={() => handleViewResults(test)}
                  className="w-full"
                >
                  View Results
                </Button>
              ) : (
                <Button
                  onClick={() => handleStartTest(test)}
                  className={`w-full ${test.isRequired ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                  disabled={loading}
                >
                  {test.isRequired ? "Take Required Test" : "Take Test"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
};

export default AptitudeTestList;
