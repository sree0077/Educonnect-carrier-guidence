
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Award, CheckCircle, XCircle, Home } from 'lucide-react';

const TestResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: 'Login Required',
            description: 'Please login to view test results',
            variant: 'destructive'
          });
          navigate('/login');
          return;
        }
        
        // Get test result data
        const { data: resultData, error: resultError } = await supabase
          .from('test_results')
          .select(`
            id,
            score,
            verbal_score,
            quantitative_score,
            general_knowledge_score,
            completed_at,
            test_id,
            student_id,
            students!inner(
              profile_id
            )
          `)
          .eq('id', id)
          .single();
          
        if (resultError) throw resultError;
        
        // Check if this result belongs to the logged-in user
        if (resultData.students.profile_id !== session.user.id) {
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
        const { data: testData, error: testError } = await supabase
          .from('aptitude_tests')
          .select('*')
          .eq('id', resultData.test_id)
          .single();
          
        if (testError) throw testError;
        
        setTest(testData);
      } catch (error: any) {
        console.error('Error fetching test results:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test results',
          variant: 'destructive'
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchResults();
    }
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
  
  const pieData = [
    { name: 'Verbal', value: testResult?.verbal_score || 0, color: '#4F46E5' },
    { name: 'Quantitative', value: testResult?.quantitative_score || 0, color: '#10B981' },
    { name: 'General Knowledge', value: testResult?.general_knowledge_score || 0, color: '#F59E0B' }
  ];

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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>Your test score and performance breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="bg-gray-50 rounded-full w-40 h-40 flex items-center justify-center mb-6">
              <div className="text-center">
                <span className="block text-5xl font-bold text-purple-600">{testResult?.score || 0}%</span>
                <span className="text-sm text-gray-500">Overall Score</span>
              </div>
            </div>
            
            {overallBadge && (
              <div className={`flex items-center px-3 py-1 rounded-full ${overallBadge.bg} ${overallBadge.color} text-sm font-medium mb-6`}>
                {overallBadge.icon}
                {overallBadge.label}
              </div>
            )}
            
            <div className="w-full mt-4">
              <h3 className="text-lg font-medium mb-4 text-center">Score Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testResult?.verbal_score !== null && (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <span className="text-2xl font-bold text-indigo-600 block">{testResult?.verbal_score}%</span>
                    <span className="text-sm text-gray-500">Verbal</span>
                  </div>
                )}
                
                {testResult?.quantitative_score !== null && (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <span className="text-2xl font-bold text-emerald-600 block">{testResult?.quantitative_score}%</span>
                    <span className="text-sm text-gray-500">Quantitative</span>
                  </div>
                )}
                
                {testResult?.general_knowledge_score !== null && (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <span className="text-2xl font-bold text-amber-600 block">{testResult?.general_knowledge_score}%</span>
                    <span className="text-sm text-gray-500">General Knowledge</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Chart</CardTitle>
            <CardDescription>Visual representation of your scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <p className="text-sm text-gray-500">
              Test completed on {new Date(testResult?.completed_at).toLocaleDateString()}
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Recommendations based on your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResult?.score >= 70 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Excellent Performance!</h3>
                <p className="text-green-700">
                  Based on your high score, you show strong aptitude in these areas. Consider applying to competitive programs that align with your strengths.
                </p>
              </div>
            ) : testResult?.score >= 50 ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Good Performance</h3>
                <p className="text-blue-700">
                  You've demonstrated solid skills in several areas. Consider programs that build on your strengths while providing support in areas where you scored lower.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">Areas for Growth</h3>
                <p className="text-yellow-700">
                  This test has identified some areas where additional preparation could help. Consider focused study in the lower-scoring areas before applying to programs.
                </p>
              </div>
            )}
            
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-md">
              <h3 className="font-medium text-purple-800 mb-2">Explore College Options</h3>
              <p className="text-purple-700 mb-3">
                Now that you have completed the aptitude test, you can explore colleges and courses that match your strengths and interests.
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
