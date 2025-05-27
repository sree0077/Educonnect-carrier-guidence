import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Award, CheckCircle, XCircle, Home } from 'lucide-react';
import { auth, db } from "@config/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const TestResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [test, setTest] = useState<any>(null);

  useEffect(() => {
    let unsubscribe: any;
    const fetchResults = async (user: any) => {
      setLoading(true);
      try {
        if (!user) {
          toast({
            title: 'Login Required',
            description: 'Please login to view test results',
            variant: 'destructive'
          });
          navigate('/login');
          return;
        }

        console.log(`Fetching test result with ID: ${id}`);

        // Get student document by profile_id
        const studentsRef = collection(db, 'students');
        const studentQuery = query(studentsRef, where('profile_id', '==', user.uid));
        const studentSnapshot = await getDocs(studentQuery);

        if (studentSnapshot.empty) {
          console.error('No student profile found for user:', user.uid);
          toast({
            title: 'Profile Missing',
            description: 'No student profile found. Please complete your profile first.',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }

        const studentId = studentSnapshot.docs[0].id;
        console.log('Found student document ID:', studentId);

        // First, try to get the test result directly by ID
        try {
          const resultDoc = await getDoc(doc(db, 'test_results', id));

          if (resultDoc.exists()) {
            const resultData = resultDoc.data();
            console.log('Found test result data by ID:', resultData);

            // Check if this result belongs to the logged-in student
            if (resultData.student_id !== studentId) {
              console.log(`Access denied: Result belongs to student ${resultData.student_id}, not ${studentId}`);
              toast({
                title: 'Access Denied',
                description: 'You can only view your own test results',
                variant: 'destructive'
              });
              navigate('/dashboard');
              return;
            }

            setTestResult(resultData);

            // Get test data
            const testDoc = await getDoc(doc(db, 'aptitude_tests', resultData.test_id));
            if (testDoc.exists()) {
              setTest(testDoc.data());
            } else {
              console.error('Test not found with ID:', resultData.test_id);
            }

            return; // Exit early if we found the result by ID
          } else {
            console.log(`Test result not found directly with ID: ${id}, trying alternative lookup`);
          }
        } catch (error) {
          console.error('Error fetching test result by ID:', error);
        }

        // If we get here, we couldn't find the result by ID directly
        // Try to find it by querying for the test ID and student ID
        const resultsQuery = query(
          collection(db, 'test_results'),
          where('test_id', '==', id),
          where('student_id', '==', studentId)
        );

        const resultsSnapshot = await getDocs(resultsQuery);

        if (resultsSnapshot.empty) {
          console.error(`No test results found for test ${id} and student ${studentId}`);
          throw new Error('Test result not found');
        }

        // Get the first (and hopefully only) result document
        const resultDoc = resultsSnapshot.docs[0];
        const resultData = resultDoc.data();

        console.log(`Found test result by query:`, resultData);

        setTestResult(resultData);

        // Get test data
        const testDoc = await getDoc(doc(db, 'aptitude_tests', resultData.test_id));
        if (!testDoc.exists()) {
          console.error('Test not found with ID:', resultData.test_id);
          throw new Error('Test not found');
        }
        setTest(testDoc.data());
      } catch (error) {
        console.error('Error fetching test results:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test results. Please try again later.',
          variant: 'destructive'
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (id) fetchResults(user);
    });

    return () => unsubscribe && unsubscribe();
  }, [id, navigate, toast]);

  const getBadgeForScore = (score: number) => {
    if (score >= 80) {
      return {
        color: 'text-green-700',
        bg: 'bg-green-100',
        label: 'Excellent',
        icon: <CheckCircle className="mr-1.5 h-4 w-4 text-green-700" />
      };
    } else if (score >= 60) {
      return {
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        label: 'Good',
        icon: <Award className="mr-1.5 h-4 w-4 text-blue-700" />
      };
    } else if (score >= 40) {
      return {
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        label: 'Average',
        icon: <Award className="mr-1.5 h-4 w-4 text-yellow-700" />
      };
    } else {
      return {
        color: 'text-red-700',
        bg: 'bg-red-100',
        label: 'Needs Improvement',
        icon: <XCircle className="mr-1.5 h-4 w-4 text-red-700" />
      };
    }
  };

  const overallBadge = testResult?.score ? getBadgeForScore(testResult.score) : null;

  // No longer need pie data as we've removed the charts

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-600">
            Test Results
          </h1>
          <p className="text-gray-600 mt-2">
            {test?.title || "Aptitude Test"}
          </p>
        </div>

        <Button onClick={() => navigate('/dashboard')}>
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Your aptitude test performance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-gray-50 rounded-full w-40 h-40 flex items-center justify-center mb-6">
              <div className="text-center">
                <span className="block text-5xl font-bold text-purple-600">{testResult?.score !== undefined ? `${testResult.score}%` : '0%'}</span>
                <span className="text-sm text-gray-500 block mb-1">Overall Score</span>
                {testResult?.passed !== undefined && (
                  <span className={`block mt-1 px-2 py-1 rounded text-xs font-medium ${
                    testResult.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {testResult.passed ? 'Passed' : 'Failed'}
                  </span>
                )}
              </div>
            </div>

            {overallBadge && (
              <div className={`flex items-center px-3 py-1 rounded-full ${overallBadge.bg} ${overallBadge.color} text-sm font-medium mb-6`}>
                {overallBadge.icon}
                {overallBadge.label}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center">
            <p className="text-sm text-gray-500">
              {testResult?.completed_at ? (
                typeof testResult.completed_at === 'object' && testResult.completed_at.toDate
                  ? `Test completed on ${new Date(testResult.completed_at.toDate()).toLocaleDateString()}`
                  : typeof testResult.completed_at === 'string'
                    ? `Test completed on ${new Date(testResult.completed_at).toLocaleDateString()}`
                    : 'Test completed recently'
              ) : 'Test completed'}
            </p>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>What to do next</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Test Completed</h3>
              <p className="text-blue-700">
                {testResult?.passed ?
                  "Congratulations! You have passed the aptitude test. Your application will now be processed further." :
                  "You have completed the aptitude test. Your results have been recorded and will be considered as part of your application process."}
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-100 rounded-md">
              <h3 className="font-medium text-purple-800 mb-2">Explore College Options</h3>
              <p className="text-purple-700 mb-3">
                You can explore more colleges and courses that match your interests.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Browse Colleges
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestResults;
