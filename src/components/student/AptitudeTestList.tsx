
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, Clock } from 'lucide-react';

type Test = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

const AptitudeTestList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Get all aptitude tests
        const { data: testsData, error: testsError } = await supabase
          .from('aptitude_tests')
          .select('*');
          
        if (testsError) throw testsError;
        
        // Get student data to check which tests have been completed
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', session.user.id)
          .single();
          
        if (studentError && studentError.code !== 'PGRST116') throw studentError;
        
        if (!studentData) {
          setTests(testsData.map((test: any) => ({ ...test, completed: false })));
          setLoading(false);
          return;
        }
        
        // Get completed tests
        const { data: completedTests, error: completedError } = await supabase
          .from('test_results')
          .select('test_id')
          .eq('student_id', studentData.id);
          
        if (completedError) throw completedError;
        
        const completedTestIds = completedTests?.map(result => result.test_id) || [];
        
        // Mark tests as completed based on results
        const formattedTests = testsData.map((test: any) => ({
          ...test,
          completed: completedTestIds.includes(test.id)
        }));
        
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
    };
    
    fetchTests();
  }, [toast]);
  
  const handleStartTest = (testId: string) => {
    navigate(`/test/${testId}`);
  };
  
  const handleViewResults = (testId: string) => {
    navigate(`/test/results/${testId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
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
          <Card key={test.id} className={test.completed ? "border-green-200" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
                {test.title}
                {test.completed && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <Check className="mr-1 h-3 w-3" />
                    Completed
                  </span>
                )}
              </CardTitle>
              <CardDescription>{test.description}</CardDescription>
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
                  onClick={() => handleViewResults(test.id)}
                  className="w-full"
                >
                  View Results
                </Button>
              ) : (
                <Button 
                  onClick={() => handleStartTest(test.id)}
                  className="w-full"
                >
                  Take Test
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
