
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { School, MapPin, GlobeIcon, Phone, Mail, BookOpen } from 'lucide-react';

const CollegePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Get college data
        const { data: collegeData, error: collegeError } = await supabase
          .from('colleges')
          .select('*')
          .eq('id', id)
          .single();
          
        if (collegeError) throw collegeError;
        setCollege(collegeData);
        
        // Get college courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            careers!inner(name)
          `)
          .eq('college_id', id);
          
        if (coursesError) throw coursesError;
        setCourses(coursesData);
        
        // Check if user is logged in and is a student
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;
          setUserProfile(profileData);
          
          if (profileData.user_type === 'student') {
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select('id')
              .eq('profile_id', session.user.id)
              .single();
              
            if (studentError && studentError.code !== 'PGRST116') throw studentError;
            if (studentData) {
              setCurrentStudentId(studentData.id);
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching college data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load college information',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id, toast]);
  
  const handleApply = async (courseId: string) => {
    if (!userProfile) {
      toast({
        title: 'Login Required',
        description: 'Please login as a student to apply for courses',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    if (userProfile.user_type !== 'student') {
      toast({
        title: 'Error',
        description: 'Only students can apply for courses',
        variant: 'destructive'
      });
      return;
    }
    
    if (!currentStudentId) {
      toast({
        title: 'Profile Required',
        description: 'Please complete your student profile first',
        variant: 'destructive'
      });
      navigate('/dashboard');
      return;
    }
    
    // Check if already applied
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', currentStudentId)
        .eq('course_id', courseId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        toast({
          title: 'Already Applied',
          description: 'You have already applied for this course',
          variant: 'destructive'
        });
        return;
      }
      
      // Create application
      const { error: applyError } = await supabase
        .from('applications')
        .insert({
          student_id: currentStudentId,
          course_id: courseId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (applyError) throw applyError;
      
      toast({
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted'
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error applying for course:', error);
      toast({
        title: 'Application Error',
        description: 'Failed to submit your application',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">College Not Found</h1>
        <p className="text-gray-600 mb-6">The college you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-purple-600 flex items-center">
            <School className="mr-2" size={28} />
            {college.name}
          </h1>
          <p className="text-gray-600 flex items-center mt-2">
            <MapPin className="mr-1" size={16} />
            {college.location}, {college.country}
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="contact">Contact Information</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>About {college.name}</CardTitle>
              <CardDescription>College overview and information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700">
                  {college.description || "No description provided for this college."}
                </p>
                
                {college.address && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Address</h3>
                    <p className="text-gray-600">{college.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courses">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Available Courses</h2>
            {courses.length === 0 ? (
              <p className="text-gray-500">No courses are currently available at this college.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <Card key={course.id} className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                          <span>{course.name}</span>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        Field: {course.careers.name}
                        {course.duration && ` • Duration: ${course.duration}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-gray-500 mb-4">
                        {course.description || "No description available for this course."}
                      </p>
                      
                      {course.fees && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Fees:</span> ₹{course.fees.toLocaleString()}
                        </div>
                      )}
                      
                      {course.admission_criteria && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-1">Admission Criteria:</h4>
                          <p className="text-sm text-gray-500">{course.admission_criteria}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      {userProfile?.user_type === 'student' && (
                        <Button 
                          onClick={() => handleApply(course.id)} 
                          className="w-full"
                        >
                          Apply Now
                        </Button>
                      )}
                      
                      {!userProfile && (
                        <Button 
                          onClick={() => navigate('/login')}
                          className="w-full"
                        >
                          Login to Apply
                        </Button>
                      )}
                      
                      {userProfile?.user_type === 'college' && (
                        <Button 
                          variant="outline"
                          disabled
                          className="w-full"
                        >
                          College accounts cannot apply
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Get in touch with {college.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {college.contact_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <a href={`mailto:${college.contact_email}`} className="text-blue-600 hover:underline">
                        {college.contact_email}
                      </a>
                    </div>
                  </div>
                )}
                
                {college.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Phone</h4>
                      <a href={`tel:${college.contact_phone}`} className="text-blue-600 hover:underline">
                        {college.contact_phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {college.website && (
                  <div className="flex items-start gap-3">
                    <GlobeIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Website</h4>
                      <a 
                        href={college.website.startsWith('http') ? college.website : `https://${college.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        {college.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {!college.contact_email && !college.contact_phone && !college.website && (
                  <p className="text-gray-500">No contact information provided by this college.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollegePage;
