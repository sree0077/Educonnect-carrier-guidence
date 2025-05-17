
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

type Question = {
  id: string;
  question_text: string;
  category: string;
  options: { [key: string]: string };
  correct_answer: string;
};

const AptitudeTest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [studentId, setStudentId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      
      try {
        // Check if user is logged in and is a student
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: 'Login Required',
            description: 'Please login as a student to take this test',
            variant: 'destructive'
          });
          navigate('/login');
          return;
        }
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profileData.user_type !== 'student') {
          toast({
            title: 'Access Denied',
            description: 'Only students can take aptitude tests',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }
        
        // Get student ID
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', session.user.id)
          .single();
          
        if (studentError) throw studentError;
        
        setStudentId(studentData.id);
        
        // Check if already completed
        const { data: completedData, error: completedError } = await supabase
          .from('test_results')
          .select('id')
          .eq('student_id', studentData.id)
          .eq('test_id', id);
          
        if (completedError) throw completedError;
        
        if (completedData && completedData.length > 0) {
          toast({
            title: 'Test Already Taken',
            description: 'You have already completed this test',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }
        
        // Get test information
        const { data: testData, error: testError } = await supabase
          .from('aptitude_tests')
          .select('*')
          .eq('id', id)
          .single();
          
        if (testError) throw testError;
        
        setTest(testData);
        
        // Get test questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('test_id', id);
          
        if (questionsError) throw questionsError;
        
        if (!questionsData || questionsData.length === 0) {
          toast({
            title: 'No Questions',
            description: 'This test has no questions available',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }
        
        setQuestions(questionsData);
        
      } catch (error: any) {
        console.error('Error fetching test data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test information',
          variant: 'destructive'
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTest();
    }
  }, [id, navigate, toast]);
  
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
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleAnswerChange = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitTest = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      if (!studentId || !test) {
        throw new Error('Student ID or test not found');
      }
      
      // Calculate scores
      let totalScore = 0;
      let verbalScore = 0;
      let quantitativeScore = 0;
      let generalKnowledgeScore = 0;
      
      let verbalCount = 0;
      let quantitativeCount = 0;
      let generalKnowledgeCount = 0;
      
      questions.forEach(question => {
        const userAnswer = answers[question.id];
        
        if (userAnswer === question.correct_answer) {
          totalScore++;
          
          if (question.category === 'verbal') {
            verbalScore++;
          } else if (question.category === 'quantitative') {
            quantitativeScore++;
          } else if (question.category === 'general_knowledge') {
            generalKnowledgeScore++;
          }
        }
        
        if (question.category === 'verbal') {
          verbalCount++;
        } else if (question.category === 'quantitative') {
          quantitativeCount++;
        } else if (question.category === 'general_knowledge') {
          generalKnowledgeCount++;
        }
      });
      
      // Convert to percentages
      const percentageScore = Math.round((totalScore / questions.length) * 100);
      const percentageVerbal = verbalCount > 0 ? Math.round((verbalScore / verbalCount) * 100) : null;
      const percentageQuantitative = quantitativeCount > 0 ? Math.round((quantitativeScore / quantitativeCount) * 100) : null;
      const percentageGeneral = generalKnowledgeCount > 0 ? Math.round((generalKnowledgeScore / generalKnowledgeCount) * 100) : null;
      
      // Save the test result
      const { data: resultData, error: resultError } = await supabase
        .from('test_results')
        .insert({
          student_id: studentId,
          test_id: test.id,
          score: percentageScore,
          verbal_score: percentageVerbal,
          quantitative_score: percentageQuantitative,
          general_knowledge_score: percentageGeneral,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
        
      if (resultError) throw resultError;
      
      toast({
        title: 'Test Completed',
        description: 'Your test has been submitted successfully'
      });
      
      navigate(`/test/results/${resultData.id}`);
    } catch (error: any) {
      console.error('Error submitting test:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your test results',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;
    
  const currentQuestion = questions[currentQuestionIndex];
  const answerOptions = currentQuestion?.options ? Object.entries(currentQuestion.options) : [];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

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
            {test?.title}
          </h1>
          <p className="text-gray-600 mt-2">
            {test?.description || "Aptitude Test"}
          </p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-2 flex items-center">
          <Clock className="mr-2 text-amber-500" />
          <span className="font-medium">Time Remaining: {formatTime(timeLeft)}</span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">
            <span className="mr-2 inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
              {currentQuestion?.category === 'verbal' ? 'Verbal' : 
               currentQuestion?.category === 'quantitative' ? 'Quantitative' : 'General Knowledge'}
            </span>
            Question {currentQuestionIndex + 1}
          </CardTitle>
          <CardDescription>Select the best answer from the options below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-medium mb-6">
            {currentQuestion?.question_text}
          </div>
          
          <RadioGroup 
            value={currentAnswer} 
            onValueChange={handleAnswerChange}
          >
            {answerOptions.map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 mb-4 p-3 border rounded-md hover:bg-gray-50">
                <RadioGroupItem value={key} id={`option-${key}`} />
                <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                  {value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            onClick={handlePrevious}
            variant="outline"
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {isLastQuestion ? (
            <Button 
              onClick={handleSubmitTest}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {questions.map((_, index) => (
          <Button 
            key={index}
            variant={index === currentQuestionIndex ? "default" : answers[questions[index].id] ? "outline" : "ghost"}
            className={`h-10 w-10 p-0 ${answers[questions[index].id] ? "border-green-500 text-green-700" : ""}`}
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmitTest}
          className="flex items-center" 
          disabled={submitting}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {submitting ? 'Submitting...' : 'Submit Test'}
        </Button>
      </div>
      
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
        <div className="flex items-start">
          <AlertTriangle className="text-amber-500 mr-3 mt-1" />
          <div>
            <h3 className="font-medium text-amber-800">Important Information</h3>
            <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
              <li>Once you submit the test, you cannot retake it</li>
              <li>Make sure to answer all questions before submitting</li>
              <li>The test will be automatically submitted when the time runs out</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeTest;
