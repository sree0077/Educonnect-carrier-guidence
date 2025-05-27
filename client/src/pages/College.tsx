import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { School, MapPin, GlobeIcon, Phone, Mail, BookOpen } from 'lucide-react';
import { auth, db } from "@config/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";

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
        // Get college data from Firestore
        const collegeDoc = await getDoc(doc(db, 'colleges', id));
        if (!collegeDoc.exists()) throw new Error('College not found');
        setCollege(collegeDoc.data());

        // Get college courses from subcollection
        try {
          // First try to get courses from the subcollection
          const coursesSubcollectionRef = collection(db, 'colleges', id, 'courses');
          let coursesSnapshot = await getDocs(coursesSubcollectionRef);

          // If no courses found in subcollection, try the old way (for backward compatibility)
          if (coursesSnapshot.empty) {
            console.log('No courses found in subcollection, trying old collection...');
            const coursesQuery = query(collection(db, 'courses'), where('college_id', '==', id));
            coursesSnapshot = await getDocs(coursesQuery);
          }

          const coursesData = coursesSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          setCourses(coursesData);
        } catch (courseError) {
          console.error('Error fetching courses:', courseError);
        }

        // Check if user is logged in and is a student or college
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            // Try to get student profile
            const studentDoc = await getDoc(doc(db, 'students', user.uid));
            if (studentDoc.exists()) {
              const profileData = studentDoc.data();
              setUserProfile({ ...profileData, user_type: 'student' });
              setCurrentStudentId(user.uid);
            } else {
              // Try to get college profile
              const collegeProfileDoc = await getDoc(doc(db, 'colleges', user.uid));
              if (collegeProfileDoc.exists()) {
                setUserProfile({ ...collegeProfileDoc.data(), user_type: 'college' });
              }
            }
          }
        });
      } catch (error) {
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
    try {
      // Check if already applied - using student's applications subcollection
      const applicationsRef = collection(db, 'students', currentStudentId, 'applications');
      const applicationsQuery = query(
        applicationsRef,
        where('course_id', '==', courseId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      if (!applicationsSnapshot.empty) {
        toast({
          title: 'Already Applied',
          description: 'You have already applied for this course',
          variant: 'destructive'
        });
        return;
      }
      // Get college document to ensure we have the correct ID
      const collegeDoc = await getDoc(doc(db, 'colleges', id));
      const collegeData = collegeDoc.exists() ? collegeDoc.data() : null;
      const collegeProfileId = collegeData?.profile_id;

      console.log('Submitting application with college data:', {
        collegeId: id,
        collegeProfileId: collegeProfileId || 'not found'
      });

      // Get course data to include course name
      console.log(`Fetching course with ID: ${courseId} from college: ${id}`);
      const courseDoc = await getDoc(doc(db, 'colleges', id, 'courses', courseId));

      if (courseDoc.exists()) {
        console.log('Course data found:', courseDoc.data());
      } else {
        console.log('Course not found in subcollection, checking standalone collection');
        // Try the old way as fallback
        const oldCourseDoc = await getDoc(doc(db, 'courses', courseId));
        if (oldCourseDoc.exists()) {
          console.log('Course found in standalone collection:', oldCourseDoc.data());
        } else {
          console.log('Course not found in either location');
        }
      }

      const courseName = courseDoc.exists() ? courseDoc.data().name || 'Unknown Course' : 'Unknown Course';

      // Create application in student's subcollection
      await addDoc(collection(db, 'students', currentStudentId, 'applications'), {
        student_id: currentStudentId,
        course_id: courseId,
        course_name: courseName,
        college_id: id, // The document ID of the college
        college_profile_id: collegeProfileId || id, // The profile_id (user.uid) of the college
        status: 'pending',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      toast({
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted'
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error applying for course:', error);
      toast({
        title: 'Application Error',
        description: error && error.message ? error.message : 'Failed to submit your application',
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
                        Field: {course.career_name}
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
