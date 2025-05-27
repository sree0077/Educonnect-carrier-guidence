import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FilePenLine,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { auth, db } from '@config/firebase.config';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import Select from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

type Application = {
  id: string;
  status: string;
  created_at: string;
  student_id: string;
  college: {
    name: string;
  };
  course: {
    name: string;
  };
  aptitude_test_id?: string | null;
  test_result?: {
    score: number;
    passed?: boolean;
    completed_at?: any;
  } | null;
};

const ApplicationsTable = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState<Array<{id: string, name?: string, collegeName?: string}>>([]);
  const [courses, setCourses] = useState<Array<{id: string, name: string, college_id?: string}>>([]);
  const [filteredCourses, setFilteredCourses] = useState<Array<{id: string, name: string, college_id?: string}>>([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Get student document by profile_id
        const studentsRef = collection(db, 'students');
        const studentQuery = query(studentsRef, where('profile_id', '==', user.uid));
        const studentSnapshot = await getDocs(studentQuery);
        if (studentSnapshot.empty) throw new Error('Student not found');
        const studentId = studentSnapshot.docs[0].id;
        // Get applications from student's subcollection
        const applicationsRef = collection(db, 'students', studentId, 'applications');
        const applicationsSnapshot = await getDocs(applicationsRef);
        console.log(`Found ${applicationsSnapshot.docs.length} applications for student ${studentId}`);

        // Optimize: Batch fetch all unique colleges and courses first
        const uniqueCollegeIds = [...new Set(applicationsSnapshot.docs.map(doc => doc.data().college_id).filter(Boolean))];
        const uniqueCourseRequests = [...new Set(applicationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return data.course_id && data.college_id ? `${data.college_id}/${data.course_id}` : null;
        }).filter(Boolean))];

        // Batch fetch colleges
        const collegePromises = uniqueCollegeIds.map(async (collegeId) => {
          try {
            const collegeDoc = await getDoc(doc(db, 'colleges', collegeId));
            return { id: collegeId, data: collegeDoc.exists() ? collegeDoc.data() : null };
          } catch (error) {
            console.error(`Error fetching college ${collegeId}:`, error);
            return { id: collegeId, data: null };
          }
        });

        // Batch fetch courses
        const coursePromises = uniqueCourseRequests.map(async (courseRequest) => {
          const [collegeId, courseId] = courseRequest.split('/');
          try {
            const courseDoc = await getDoc(doc(db, 'colleges', collegeId, 'courses', courseId));
            if (courseDoc.exists()) {
              return { key: courseRequest, data: courseDoc.data() };
            } else {
              // Fallback to old collection
              const oldCourseDoc = await getDoc(doc(db, 'courses', courseId));
              return { key: courseRequest, data: oldCourseDoc.exists() ? oldCourseDoc.data() : null };
            }
          } catch (error) {
            console.error(`Error fetching course ${courseRequest}:`, error);
            return { key: courseRequest, data: null };
          }
        });

        // Execute all fetches in parallel
        const [collegeResults, courseResults] = await Promise.all([
          Promise.all(collegePromises),
          Promise.all(coursePromises)
        ]);

        // Create lookup maps for faster access
        const collegeMap = new Map(collegeResults.map(result => [result.id, result.data]));
        const courseMap = new Map(courseResults.map(result => [result.key, result.data]));

        const applicationsData = await Promise.all(applicationsSnapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();

          // Get course and college from cached maps
          const courseKey = appData.course_id && appData.college_id ? `${appData.college_id}/${appData.course_id}` : null;
          const course = { name: courseKey && courseMap.get(courseKey)?.name || '' };
          const college = { name: collegeMap.get(appData.college_id)?.name || '' };

          // Debug test results
          if (appData.test_result) {
            console.log(`Application ${appDoc.id} has test_result:`, appData.test_result);
          } else {
            console.log(`Application ${appDoc.id} has NO test_result`);
          }

          // If there's an aptitude test ID, check for test results
          let testResult = appData.test_result || null;

          if (appData.aptitude_test_id && !testResult) {
            console.log(`Application ${appDoc.id} has aptitude test ID: ${appData.aptitude_test_id} but no test_result, checking test_results collection`);

            try {
              // First try to find a test result with this application ID
              const appResultsQuery = query(
                collection(db, 'test_results'),
                where('application_id', '==', appDoc.id)
              );
              let resultsSnapshot = await getDocs(appResultsQuery);

              // If not found, try with test_id and student_id
              if (resultsSnapshot.empty) {
                console.log(`No test result found with application_id ${appDoc.id}, trying with test_id and student_id`);
                const testResultsQuery = query(
                  collection(db, 'test_results'),
                  where('test_id', '==', appData.aptitude_test_id),
                  where('student_id', '==', studentId)
                );
                resultsSnapshot = await getDocs(testResultsQuery);
              }

              if (!resultsSnapshot.empty) {
                const resultData = resultsSnapshot.docs[0].data();
                console.log(`Found test result in test_results collection:`, resultData);

                testResult = {
                  score: resultData.score,
                  passed: resultData.passed,
                  completed_at: resultData.completed_at
                };

                // Update the application with the test result
                try {
                  await updateDoc(doc(db, 'students', studentId, 'applications', appDoc.id), {
                    test_result: testResult,
                    updated_at: new Date().toISOString()
                  });
                  console.log(`Updated application ${appDoc.id} with test result`);
                } catch (updateError) {
                  console.error(`Error updating application with test result:`, updateError);
                }
              } else {
                console.log(`No test result found for application ${appDoc.id} with test ID ${appData.aptitude_test_id}`);
              }
            } catch (error) {
              console.error('Error fetching test result:', error);
            }
          }

          return {
            id: appDoc.id,
            status: appData.status,
            created_at: appData.created_at || appData.updated_at || new Date().toISOString(), // Fallback to current date
            student_id: studentId,
            course,
            college,
            aptitude_test_id: appData.aptitude_test_id || null,
            test_result: testResult
          };
        }));
        setApplications(applicationsData);
      } catch (error: any) {
        console.error('Error fetching applications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load applications',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [toast]);

  useEffect(() => {
    const fetchCollegesAndCourses = async () => {
      try {
        // Fetch colleges
        const collegesSnapshot = await getDocs(collection(db, 'colleges'));

        // Log raw college data for debugging
        console.log('Raw college data:', collegesSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        })));

        const collegesData = collegesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.collegeName || 'Unknown College',
            ...data
          };
        });

        console.log('Processed college data:', collegesData);
        setColleges(collegesData);

        // Fetch all courses from all colleges' subcollections
        let allCourses = [];

        // For each college, fetch its courses subcollection
        for (const college of collegesData) {
          try {
            console.log(`Fetching courses for college: ${college.id} (${college.name})`);
            const coursesSnapshot = await getDocs(collection(db, 'colleges', college.id, 'courses'));

            console.log(`Found ${coursesSnapshot.docs.length} courses for college ${college.id}`);

            if (!coursesSnapshot.empty) {
              const collegeCourses = coursesSnapshot.docs.map(doc => {
                const courseData = doc.data();
                return {
                  id: doc.id,
                  college_id: college.id,
                  college_name: (college as any).name || (college as any).collegeName || 'Unknown College',
                  name: courseData.name || 'Unnamed Course',
                  ...courseData
                };
              });

              console.log(`Processed courses for college ${college.id}:`, collegeCourses);
              allCourses = [...allCourses, ...collegeCourses];
            }
          } catch (err) {
            console.error(`Error fetching courses for college ${college.id}:`, err);
          }
        }

        // If no courses found in subcollections, try the old way as fallback
        if (allCourses.length === 0) {
          console.log('No courses found in subcollections, trying old collection...');
          const coursesSnapshot = await getDocs(collection(db, 'courses'));
          const oldCoursesData = coursesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unnamed Course',
              college_id: data.college_id,
              ...data
            };
          });
          allCourses = oldCoursesData;
        }

        console.log(`Found ${allCourses.length} courses across all colleges:`, allCourses);
        setCourses(allCourses);
      } catch (error) {
        console.error('Error fetching colleges or courses:', error);
      }
    };

    fetchCollegesAndCourses();
  }, []);

  // Function to force refresh courses for a college
  const forceRefreshCourses = async (collegeId: string) => {
    console.log(`Force refreshing courses for college ID: ${collegeId}`);
    try {
      // Clear filtered courses first
      setFilteredCourses([]);

      // Try to get courses from the subcollection
      const coursesSnapshot = await getDocs(collection(db, 'colleges', collegeId, 'courses'));
      console.log(`Force refresh found ${coursesSnapshot.docs.length} courses`);

      if (!coursesSnapshot.empty) {
        const collegeCourses = coursesSnapshot.docs.map(doc => {
          const courseData = doc.data();
          return {
            id: doc.id,
            college_id: collegeId,
            name: courseData.name || 'Unnamed Course',
            ...courseData
          };
        });

        console.log('Force refreshed courses:', collegeCourses);
        setFilteredCourses(collegeCourses);

        // Update main courses state
        setCourses(prevCourses => {
          const newCourses = [...prevCourses];
          collegeCourses.forEach(course => {
            if (!newCourses.some(c => c.id === course.id)) {
              newCourses.push(course);
            }
          });
          return newCourses;
        });

        return collegeCourses;
      } else {
        console.log('No courses found in force refresh');
        return [];
      }
    } catch (error) {
      console.error(`Error force refreshing courses for college ${collegeId}:`, error);
      return [];
    }
  };

  // Function to create a default course for a college
  const createDefaultCourse = async (collegeId: string) => {
    console.log(`Creating default course for college ID: ${collegeId}`);
    try {
      // First get the college name
      const collegeDoc = await getDoc(doc(db, 'colleges', collegeId));
      if (!collegeDoc.exists()) {
        console.error('College document does not exist');
        return null;
      }

      // Create a default course
      const defaultCourse = {
        name: 'General Studies',
        description: 'A general studies program covering various subjects',
        college_id: collegeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to the courses subcollection
      const courseRef = collection(db, 'colleges', collegeId, 'courses');
      const docRef = await addDoc(courseRef, defaultCourse);

      console.log('Default course created with ID:', docRef.id);

      // Return the course with its ID
      const courseWithId = {
        id: docRef.id,
        college_id: collegeId,
        name: defaultCourse.name,
        description: defaultCourse.description,
        created_at: defaultCourse.created_at,
        updated_at: defaultCourse.updated_at
      };

      return courseWithId;
    } catch (error) {
      console.error('Error creating default course:', error);
      return null;
    }
  };

  // Function to directly fetch courses for a specific college
  const fetchCoursesForCollege = async (collegeId: string) => {
    console.log(`Directly fetching courses for college ID: ${collegeId}`);
    try {
      // Try to get courses from the subcollection
      const coursesSnapshot = await getDocs(collection(db, 'colleges', collegeId, 'courses'));
      console.log(`Direct fetch found ${coursesSnapshot.docs.length} courses`);

      if (!coursesSnapshot.empty) {
        const collegeCourses = coursesSnapshot.docs.map(doc => {
          const courseData = doc.data();
          return {
            id: doc.id,
            college_id: collegeId,
            name: courseData.name || 'Unnamed Course',
            ...courseData
          };
        });

        console.log('Directly fetched courses:', collegeCourses);
        return collegeCourses;
      } else {
        console.log('No courses found in direct fetch');
        return [];
      }
    } catch (error) {
      console.error(`Error directly fetching courses for college ${collegeId}:`, error);
      return [];
    }
  };

  // Filter courses when college is selected
  useEffect(() => {
    if (selectedCollege) {
      console.log('Selected college:', selectedCollege);
      console.log('All courses:', courses);

      // Ensure courses is an array
      const coursesArray = Array.isArray(courses) ? courses : [];

      // Filter courses that belong to the selected college
      const filtered = coursesArray.filter(course => {
        // Check if course is valid
        if (!course || typeof course !== 'object') {
          console.log('Invalid course object:', course);
          return false;
        }

        // Check if college_id is missing and add it if needed
        if (!course.college_id && course.id) {
          console.log(`Course ${course.id} missing college_id, adding it`);
          course.college_id = selectedCollege;
        }

        const matches = course.college_id === selectedCollege;
        console.log(`Course ${course.id} (${course.name}) college_id: ${course.college_id}, matches: ${matches}`);
        return matches;
      });

      console.log('Filtered courses from state:', filtered);

      // Always set filtered courses even if empty
      setFilteredCourses(filtered);

      // If no courses found in the state, try direct fetch
      if (filtered.length === 0) {
        console.log('No courses found in state, trying direct fetch');
        fetchCoursesForCollege(selectedCollege).then(directCourses => {
          if (directCourses.length > 0) {
            console.log('Setting directly fetched courses:', directCourses);
            setFilteredCourses(directCourses);

            // Also update the main courses state to include these
            setCourses(prevCourses => {
              const newCourses = [...prevCourses];
              // Add only courses that don't already exist
              directCourses.forEach(course => {
                if (!newCourses.some(c => c.id === course.id)) {
                  newCourses.push(course);
                }
              });
              return newCourses;
            });
          } else {
            // As a last resort, create a default course for this college
            console.log('No courses found, creating a default course for this college');
            createDefaultCourse(selectedCollege).then(newCourse => {
              if (newCourse) {
                console.log('Created default course:', newCourse);
                setFilteredCourses([newCourse]);
                setCourses(prevCourses => [...prevCourses, newCourse]);
              } else {
                console.log('Failed to create default course');
                setFilteredCourses([]);
              }
            });
          }
        });
      } else {
        setFilteredCourses(filtered);
      }

      // Reset selected course when college changes
      setSelectedCourse('');
    } else {
      setFilteredCourses([]);
    }
  }, [selectedCollege, courses]);

  const handleSubmitApplication = async () => {
    try {
      console.log('Starting application submission process...');
      console.log('Selected college:', selectedCollege);
      console.log('Selected course:', selectedCourse);
      console.log('Filtered courses:', filteredCourses);

      // Validate form inputs
      if (!selectedCollege || selectedCollege.trim() === '') {
        toast({
          title: 'Missing College',
          description: 'Please select a college to apply to',
          variant: 'destructive'
        });
        return;
      }

      if (!selectedCourse || selectedCourse.trim() === '') {
        toast({
          title: 'Missing Course',
          description: 'Please select a course to apply for',
          variant: 'destructive'
        });
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to submit an application',
          variant: 'destructive'
        });
        return;
      }

      console.log('Current user:', user.uid);

      // Get student document by profile_id
      const studentsRef = collection(db, 'students');
      const studentQuery = query(studentsRef, where('profile_id', '==', user.uid));
      const studentSnapshot = await getDocs(studentQuery);

      console.log('Student query results:', studentSnapshot.docs.length);

      if (studentSnapshot.empty) {
        console.error('Student not found for profile_id:', user.uid);
        throw new Error('Student not found');
      }

      const studentDoc = studentSnapshot.docs[0];
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();

      console.log('Student data:', studentData);
      console.log('Submitting application with college ID:', selectedCollege);

      // Get college document to ensure we have the correct ID
      try {
        const collegeDoc = await getDoc(doc(db, 'colleges', selectedCollege));
        console.log('College document exists:', collegeDoc.exists());

        if (collegeDoc.exists()) {
          console.log('College data:', collegeDoc.data());
        }

        // Find the selected course from our filtered courses
        let selectedCourseData = filteredCourses.find(course => course.id === selectedCourse);
        console.log('Selected course data:', selectedCourseData);

        if (!selectedCourseData) {
          console.log('Selected course not found in filtered courses, will try to fetch directly');
          console.log('Available courses:', filteredCourses);

          // Try to fetch the course directly
          console.log('Trying to fetch course directly');
          try {
            const courseDoc = await getDoc(doc(db, 'colleges', selectedCollege, 'courses', selectedCourse));
            if (courseDoc.exists()) {
              console.log('Found course directly:', courseDoc.data());
              const courseData = courseDoc.data();
              selectedCourseData = {
                id: selectedCourse,
                college_id: selectedCollege,
                name: courseData.name || 'Unnamed Course',
                ...courseData
              };
            } else {
              console.log('Course not found directly either');

              // As a last resort, create a default course
              console.log('Creating a default course as fallback');
              const defaultCourse = await createDefaultCourse(selectedCollege);
              if (defaultCourse) {
                console.log('Using created default course');
                selectedCourseData = defaultCourse;
                // We can't modify selectedCourse directly since it's a const
                // But we can use the defaultCourse.id in the application data later
              } else {
                throw new Error('Could not create or find any course');
              }
            }
          } catch (error) {
            console.error('Error fetching or creating course:', error);
            throw new Error('Failed to find or create course');
          }
        }

        // Prepare application data
        const applicationData = {
          student_id: studentId,
          student_profile: {
            full_name: studentData.full_name || 'Unknown Student'
          },
          college_id: selectedCollege,
          college_profile_id: collegeDoc.exists() ? collegeDoc.data().profile_id || selectedCollege : selectedCollege,
          // Use the course ID from selectedCourseData if it was created as a fallback
          course_id: selectedCourseData.id || selectedCourse,
          course_name: selectedCourseData.name || 'Unknown Course',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Application data to be submitted:', applicationData);

        // Add application to student's applications subcollection
        const applicationsRef = collection(db, 'students', studentId, 'applications');
        const docRef = await addDoc(applicationsRef, applicationData);

        console.log('Application submitted successfully with ID:', docRef.id);

        toast({
          title: 'Success',
          description: 'Application submitted successfully',
          variant: 'default'
        });

        setIsDialogOpen(false);
        setSelectedCollege('');
        setSelectedCourse('');
      } catch (collegeError) {
        console.error('Error with college document or course data:', collegeError);
        toast({
          title: 'Error',
          description: `Failed to find college or course information: ${collegeError.message}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: `Failed to submit application: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="mr-1 h-3 w-3" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Applications</h3>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) {
              // When dialog opens, refresh the courses for the selected college if any
              if (selectedCollege) {
                console.log('Dialog opened, refreshing courses for selected college:', selectedCollege);
                forceRefreshCourses(selectedCollege);
              }
            }
          }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FilePenLine className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit New Application</DialogTitle>
              <DialogDescription>
                Select a college and course to apply for
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {colleges.length > 0 ? (
                <Select
                  label="College"
                  options={colleges.map((college) => {
                    const data = college as any; // Type assertion to avoid TypeScript errors
                    return {
                      value: college.id,
                      label: data.name || data.collegeName || 'Unknown College'
                    };
                  })}
                  value={selectedCollege}
                  placeholder="Select a college"
                  onChange={(value: string) => {
                    console.log('Selected college ID:', value);
                    setSelectedCollege(value);
                    // Reset selected course when college changes
                    setSelectedCourse('');
                    // Immediately try to fetch courses for this college
                    fetchCoursesForCollege(value).then(directCourses => {
                      if (directCourses.length > 0) {
                        console.log('Setting directly fetched courses on college change:', directCourses);
                        setFilteredCourses(directCourses);

                        // Also update the main courses state to include these
                        setCourses(prevCourses => {
                          const newCourses = [...prevCourses];
                          // Add only courses that don't already exist
                          directCourses.forEach(course => {
                            if (!newCourses.some(c => c.id === course.id)) {
                              newCourses.push(course);
                            }
                          });
                          return newCourses;
                        });
                      } else {
                        // If no courses found, create a default one immediately
                        console.log('No courses found for college, creating default course');
                        createDefaultCourse(value).then(defaultCourse => {
                          if (defaultCourse) {
                            console.log('Created default course on college selection:', defaultCourse);
                            setFilteredCourses([defaultCourse]);
                            setCourses(prev => [...prev, defaultCourse]);
                            // Auto-select the course
                            setSelectedCourse(defaultCourse.id);
                          } else {
                            // If we couldn't create a default course, set an empty array
                            setFilteredCourses([]);
                          }
                        });
                      }
                    });
                  }}
                />
              ) : (
                <div className="p-2 text-center border rounded-md bg-amber-50 text-amber-700">
                  No colleges found. Please try again later.
                </div>
              )}

              {(() => {
                console.log('Rendering course section. selectedCollege:', selectedCollege);
                console.log('filteredCourses:', filteredCourses);
                console.log('filteredCourses.length:', filteredCourses.length);
                return null;
              })()}
              {selectedCollege ? (
                (() => {
                  console.log('Course dropdown condition check:');
                  console.log('- filteredCourses.length > 0:', filteredCourses.length > 0);
                  console.log('- filteredCourses:', filteredCourses);
                  return null;
                })()
              ) : null}
              {selectedCollege && (
                <div className="space-y-2">
                  <Select
                    label="Course"
                    options={Array.isArray(filteredCourses) ? filteredCourses.map((course) => {
                      console.log('Mapping course to option:', course);
                      return {
                        value: course.id,
                        label: course.name || 'Unnamed Course'
                      };
                    }) : []}
                    value={selectedCourse}
                    placeholder="Select a course"
                    onChange={(value: string) => {
                    console.log('Selected course ID:', value);
                    setSelectedCourse(value);

                    // Verify the course exists in our filtered courses
                    const courseExists = filteredCourses.some(course => course.id === value);
                    if (!courseExists) {
                      console.warn('Selected course not found in filtered courses, fetching directly');
                      // Try to fetch the course directly
                      getDoc(doc(db, 'colleges', selectedCollege, 'courses', value))
                        .then(courseDoc => {
                          if (courseDoc.exists()) {
                            console.log('Found course directly:', courseDoc.data());
                            const courseData = courseDoc.data();
                            const course = {
                              id: value,
                              college_id: selectedCollege,
                              name: courseData.name || 'Unnamed Course',
                              ...courseData
                            };

                            // Add to filtered courses
                            setFilteredCourses(prev => [...prev, course]);

                            // Also add to main courses
                            setCourses(prev => {
                              if (!prev.some(c => c.id === value)) {
                                return [...prev, course];
                              }
                              return prev;
                            });
                          }
                        })
                        .catch(err => console.error('Error fetching course:', err));
                    }
                  }}
                  />
                  {filteredCourses.length === 0 && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          console.log('Manually creating default course');
                          createDefaultCourse(selectedCollege).then(defaultCourse => {
                            if (defaultCourse) {
                              console.log('Manually created default course:', defaultCourse);
                              setFilteredCourses([defaultCourse]);
                              setCourses(prev => [...prev, defaultCourse]);
                              // Auto-select the course
                              setSelectedCourse(defaultCourse.id);
                            }
                          });
                        }}
                      >
                        Create Default Course
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {!selectedCollege && (
                <div className="p-2 text-center border rounded-md bg-gray-50 text-gray-500">
                  Please select a college first to see available courses
                </div>
              )}

              <Button
                onClick={handleSubmitApplication}
                className="w-full"
                disabled={!selectedCollege || !selectedCourse}
              >
                {!selectedCollege
                  ? 'Select a College First'
                  : !selectedCourse
                    ? 'Select a Course First'
                    : 'Submit Application'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {applications.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">You haven't submitted any applications yet</p>
          <Button className="mt-4">
            Browse Colleges
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Test</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(application => {
                application.college = application.college || { name: '' };
                return (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.college.name}</TableCell>
                    <TableCell>{application.course.name}</TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          // Handle different date formats
                          let dateValue: any = application.created_at;
                          let finalDate: Date;

                          if (!dateValue) {
                            return 'No Date';
                          }

                          // If it's a Firestore Timestamp object
                          if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
                            finalDate = dateValue.toDate();
                          }
                          // If it's a Firestore Timestamp with seconds
                          else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
                            finalDate = new Date(dateValue.seconds * 1000);
                          }
                          // If it's already a string or number, convert to Date
                          else {
                            finalDate = new Date(dateValue);
                          }

                          // Check if the date is valid
                          if (isNaN(finalDate.getTime())) {
                            console.warn('Invalid date value:', application.created_at);
                            return 'Invalid Date';
                          }

                          return format(finalDate, 'MMM d, yyyy');
                        } catch (error) {
                          console.error('Date formatting error:', error, 'for value:', application.created_at);
                          return 'Invalid Date';
                        }
                      })()}
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      {application.status === 'approved' && application.aptitude_test_id ? (
                        application.test_result ? (
                          <div className="flex flex-col gap-1">
                            {/* Pass/Fail Status */}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              application.test_result.passed === true
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {application.test_result.passed === true
                                ? <CheckCircle className="mr-1 h-3 w-3" />
                                : <XCircle className="mr-1 h-3 w-3" />
                              }
                              {application.test_result.passed === true ? 'Passed' : 'Failed'}
                            </span>

                            {/* Score */}
                            <span className="text-xs text-gray-500">
                              {application.test_result.score}% Score
                            </span>

                            {/* View Results Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                              onClick={() => {
                                // Find the test result ID and navigate to the results page
                                const fetchTestResult = async () => {
                                  try {
                                    console.log(`Fetching test result for test_id: ${application.aptitude_test_id}, student_id: ${application.student_id}`);

                                    // First try to find by application_id (most specific)
                                    let resultsQuery = query(
                                      collection(db, 'test_results'),
                                      where('application_id', '==', application.id)
                                    );

                                    let resultsSnapshot = await getDocs(resultsQuery);

                                    // If not found, try with test_id and student_id
                                    if (resultsSnapshot.empty) {
                                      console.log(`No results found with application_id, trying test_id and student_id`);
                                      resultsQuery = query(
                                        collection(db, 'test_results'),
                                        where('test_id', '==', application.aptitude_test_id),
                                        where('student_id', '==', application.student_id)
                                      );
                                      resultsSnapshot = await getDocs(resultsQuery);
                                    }

                                    if (!resultsSnapshot.empty) {
                                      const resultId = resultsSnapshot.docs[0].id;
                                      console.log(`Found test result with ID: ${resultId}, navigating to results page`);
                                      navigate(`/test/results/${resultId}`);
                                    } else {
                                      console.error('No test results found');
                                      toast({
                                        title: 'Error',
                                        description: 'Could not find test results',
                                        variant: 'destructive'
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error fetching test result:', error);
                                    toast({
                                      title: 'Error',
                                      description: 'Failed to load test results',
                                      variant: 'destructive'
                                    });
                                  }
                                };
                                fetchTestResult();
                              }}
                            >
                              View Results
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                            onClick={() => navigate(`/test/${application.aptitude_test_id}?applicationId=${application.id}`)}
                          >
                            <BookOpen className="mr-1 h-4 w-4" />
                            Take Test
                          </Button>
                        )
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {application.status === 'approved' ? 'No test required' : '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ApplicationsTable;
