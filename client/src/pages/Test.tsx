import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Clock, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { auth, db } from '@config/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getTestQuestions, saveTestResult } from '@/utils/test-helpers';
import { Question } from '@/types/question';

const Test = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [studentId, setStudentId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Extract application ID from query params if available
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const appId = queryParams.get('applicationId');
    if (appId) {
      setApplicationId(appId);
    }
  }, [location]);

  // Timer countdown
  useEffect(() => {
    if (loading || !test) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, test]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load test and questions
  useEffect(() => {
    let unsubscribe: any;

    const fetchTestData = async (user: any) => {
      if (!id) return;

      try {
        if (!user) {
          toast({
            title: 'Login Required',
            description: 'Please login to take the test',
            variant: 'destructive'
          });
          navigate('/login');
          return;
        }

        // We need to get the actual student document ID, not just the auth UID
        const studentsQuery = query(
          collection(db, 'students'),
          where('profile_id', '==', user.uid)
        );

        const studentsSnapshot = await getDocs(studentsQuery);

        if (studentsSnapshot.empty) {
          console.error('No student profile found for user:', user.uid);
          toast({
            title: 'Profile Missing',
            description: 'No student profile found. Please complete your profile first.',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }

        // Get the actual student document ID
        const actualStudentId = studentsSnapshot.docs[0].id;
        console.log(`Found student document ID: ${actualStudentId} for auth user: ${user.uid}`);
        setStudentId(actualStudentId);

        // Get test data
        const testDoc = await getDoc(doc(db, 'aptitude_tests', id));
        if (!testDoc.exists()) {
          throw new Error('Test not found');
        }

        const testData = testDoc.data();
        setTest(testData);

        // Get questions for this test
        const testQuestions = await getTestQuestions(id);
        setQuestions(testQuestions);

        // Initialize answers object
        const initialAnswers: Record<string, any> = {};
        testQuestions.forEach(q => {
          initialAnswers[q.id] = q.type === 'mcq-multiple' ? [] : null;
        });
        setAnswers(initialAnswers);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching test data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test',
          variant: 'destructive'
        });
        navigate('/dashboard');
      }
    };

    unsubscribe = onAuthStateChanged(auth, fetchTestData);
    return () => unsubscribe && unsubscribe();
  }, [id, navigate, toast]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultipleChoiceChange = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers(prev => {
      const currentSelections = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];

      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentSelections, optionId]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentSelections.filter(id => id !== optionId)
        };
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!id || !studentId) return;

    setSubmitting(true);
    try {
      console.log(`Submitting test ${id} for student ${studentId} with application ID: ${applicationId || 'none'}`);

      // Save test results
      const result = await saveTestResult(id, studentId, answers, applicationId || undefined);

      console.log('Test result saved:', result);

      // Store the result ID for navigation
      const resultId = result.id;
      console.log(`Test result ID for navigation: ${resultId}`);

      // Show appropriate message based on test result
      if (result.score >= 60) {
        toast({
          title: 'Test Submitted',
          description: 'Your test has been submitted successfully. You passed!',
        });
      } else {
        toast({
          title: 'Test Submitted',
          description: 'Your test has been submitted. Unfortunately, you did not pass.',
          variant: 'destructive'
        });
      }

      // Navigate to results page with the correct result ID
      navigate(`/test/results/${resultId}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit test',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isAnswered = (questionId: string) => {
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return answer !== null && answer !== undefined;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).filter(key => isAnswered(key)).length;

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
            {test?.title || "Aptitude Test"}
          </h1>
          <p className="text-gray-600 mt-2">
            {test?.description || "Complete all questions before submitting"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
          <Clock className="h-5 w-5 text-purple-500" />
          <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-gray-700'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span className="text-sm text-gray-500">{answeredCount} of {questions.length} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {currentQuestion && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Question {currentQuestionIndex + 1}</CardTitle>
            <CardDescription>
              {currentQuestion.categories.join(', ')} • {currentQuestion.difficultyLevel} difficulty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="mb-6 question-text"
              dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
            />

            {currentQuestion.type === 'mcq-single' && (
              <RadioGroup
                value={answers[currentQuestion.id]}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'mcq-multiple' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
                    <Checkbox
                      id={option.id}
                      checked={Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(option.id)}
                      onCheckedChange={(checked) =>
                        handleMultipleChoiceChange(currentQuestion.id, option.id, checked === true)
                      }
                    />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={handleNextQuestion}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitTest}
                disabled={submitting || answeredCount < questions.length}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Test
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`
              h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium
              ${currentQuestionIndex === index ? 'ring-2 ring-purple-500' : ''}
              ${isAnswered(q.id)
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300'}
            `}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSubmitTest}
          disabled={submitting || answeredCount < questions.length}
          className="w-full md:w-auto"
        >
          {submitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
              Submitting...
            </>
          ) : answeredCount < questions.length ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Answer all questions to submit
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Test
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Test;
