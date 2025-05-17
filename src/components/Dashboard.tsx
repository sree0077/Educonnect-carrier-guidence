
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, School, GraduationCap, Award, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      
      try {
        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!sessionData.session) {
          navigate('/login');
          return;
        }
        
        // Get user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        setUserProfile({
          ...profileData,
          email: sessionData.session.user.email
        });
      } catch (error: any) {
        console.error('Error fetching user profile:', error.message);
        toast({
          title: 'Error',
          description: 'Failed to load your profile information.',
          variant: 'destructive'
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate, toast]);
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.'
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to sign out: ${error.message}`,
        variant: 'destructive'
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  const isStudent = userProfile?.user_type === 'student';
  const isCollege = userProfile?.user_type === 'college';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-600">Dashboard</h1>
        <Button variant="outline" onClick={handleSignOut} className="flex items-center">
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <User size={20} className="mr-2 text-purple-500" />
              Profile
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-semibold">Name:</span> {userProfile?.full_name || 'Not provided'}</p>
              <p><span className="font-semibold">Email:</span> {userProfile?.email}</p>
              <p><span className="font-semibold">Account Type:</span> {userProfile?.user_type}</p>
              {isStudent && (
                <Button variant="outline" size="sm" className="mt-2">
                  Complete Student Profile
                </Button>
              )}
              {isCollege && (
                <Button variant="outline" size="sm" className="mt-2">
                  Update College Information
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {isStudent && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Award size={20} className="mr-2 text-purple-500" />
                  Aptitude Tests
                </CardTitle>
                <CardDescription>Discover your strengths</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Take aptitude tests to find your ideal career path</p>
                <Button size="sm">Take Test Now</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <School size={20} className="mr-2 text-purple-500" />
                  College Applications
                </CardTitle>
                <CardDescription>Track your applications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">No applications yet</p>
                <Button size="sm">Browse Colleges</Button>
              </CardContent>
            </Card>
          </>
        )}
        
        {isCollege && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <BookOpen size={20} className="mr-2 text-purple-500" />
                  Courses
                </CardTitle>
                <CardDescription>Manage your course offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Add or update courses to attract students</p>
                <Button size="sm">Manage Courses</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <GraduationCap size={20} className="mr-2 text-purple-500" />
                  Applications
                </CardTitle>
                <CardDescription>Student applications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">No applications to review yet</p>
                <Button size="sm">View Applications</Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-purple-800 mb-4">Getting Started</h2>
        
        {isStudent && (
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">1</span>
              </div>
              <span>Complete your student profile with educational background and interests</span>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">2</span>
              </div>
              <span>Take the aptitude test to discover careers that match your skills</span>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">3</span>
              </div>
              <span>Explore colleges offering courses aligned with your interests</span>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">4</span>
              </div>
              <span>Apply to colleges and track your application status</span>
            </li>
          </ul>
        )}
        
        {isCollege && (
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">1</span>
              </div>
              <span>Complete your college profile with detailed information</span>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">2</span>
              </div>
              <span>Add courses and programs your institution offers</span>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">3</span>
              </div>
              <span>Provide admission criteria and important details for students</span>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">4</span>
              </div>
              <span>Review and process student applications</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
