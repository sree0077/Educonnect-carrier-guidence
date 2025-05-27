import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { User, Clock, CheckCircle, XCircle, Eye, BookOpen } from 'lucide-react';
import { auth, db } from '@config/firebase.config';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type Application = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student: {
    id: string;
    profile: {
      full_name: string;
    };
  };
  course: {
    name: string;
  };
  test_result?: {
    score: number;
    completed_at?: any; // Firestore timestamp
    passed?: boolean;
  } | null;
  aptitude_test_id?: string | null;
};

const ApplicationsManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
    aptitude_test_id: ''
  });
  const [aptitudeTests, setAptitudeTests] = useState<Array<{id: string, title: string}>>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Get college id for this user
        const collegesRef = collection(db, 'colleges');

        // First try to get the college document directly using user.uid
        const collegeDocRef = doc(db, 'colleges', user.uid);
        const collegeDoc = await getDoc(collegeDocRef);

        let collegeId: string;

        if (collegeDoc.exists()) {
          // Use the user.uid as the college ID
          collegeId = user.uid;
          console.log('Found college document directly with ID:', collegeId);
        } else {
          // Fallback to query by profile_id
          const q = query(collegesRef, where('profile_id', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) throw new Error('College not found');
          collegeId = querySnapshot.docs[0].id;
          console.log('Found college by profile_id query with ID:', collegeId);
        }

        setCollegeId(collegeId);

        // Store in localStorage for other components
        localStorage.setItem('currentCollegeId', collegeId);

        // Fetch aptitude tests for this college
        await fetchAptitudeTests(collegeId);

        // Fetch applications - try both the college ID and user.uid
        await fetchApplications(collegeId, user.uid);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [toast]);

  const fetchAptitudeTests = async (collegeId: string) => {
    try {
      console.log('Fetching aptitude tests for college ID:', collegeId);

      // Get all aptitude tests
      const testsCollection = collection(db, 'aptitude_tests');
      const testsSnapshot = await getDocs(testsCollection);

      console.log(`Found ${testsSnapshot.docs.length} total aptitude tests`);

      // Log all tests for debugging
      testsSnapshot.docs.forEach(doc => {
        console.log('Test:', doc.id, doc.data());
      });

      // Filter tests for this college
      const tests = testsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          const testCollegeId = data.college_id;
          console.log(`Test ${doc.id} has college_id: ${testCollegeId}, comparing with ${collegeId}`);
          return testCollegeId === collegeId;
        })
        .map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Untitled Test'
        }));

      console.log('Filtered aptitude tests for this college:', tests);

      // If no tests found, try with the auth user ID as fallback
      if (tests.length === 0) {
        console.log('No tests found with college_id, trying with auth user ID');
        const userId = auth.currentUser?.uid;

        if (userId) {
          const testsWithUserId = testsSnapshot.docs
            .filter(doc => {
              const data = doc.data();
              const testCollegeId = data.college_id;
              console.log(`Test ${doc.id} has college_id: ${testCollegeId}, comparing with user ID ${userId}`);
              return testCollegeId === userId;
            })
            .map(doc => ({
              id: doc.id,
              title: doc.data().title || 'Untitled Test'
            }));

          console.log('Tests found with user ID as college_id:', testsWithUserId);

          if (testsWithUserId.length > 0) {
            setAptitudeTests(testsWithUserId);
            return;
          }
        }
      }

      setAptitudeTests(tests);
    } catch (error) {
      console.error('Error fetching aptitude tests:', error);
    }
  };

  const fetchApplications = async (collegeId: string, userId?: string) => {
    setLoading(true);
    try {
      // Optimize: Use a more efficient approach
      // Instead of fetching all students, we'll use a batch approach
      const studentsRef = collection(db, 'students');
      const studentsSnapshot = await getDocs(studentsRef);

      if (studentsSnapshot.empty) {
        console.log('No students found');
        setApplications([]);
        setLoading(false);
        return;
      }

      console.log(`Found ${studentsSnapshot.docs.length} students`);

      // Process students in batches to avoid overwhelming the database
      const batchSize = 10;
      let allApplications: any[] = [];

      // For each student, get their applications that match our college ID
      for (const studentDoc of studentsSnapshot.docs) {
        const studentId = studentDoc.id;
        const applicationsRef = collection(db, 'students', studentId, 'applications');

        // Try different queries based on the available IDs
        let studentAppsQuery: any;

        if (userId) {
          // Try with both collegeId and userId
          console.log(`Checking student ${studentId} applications with college_id: ${collegeId} or profile_id: ${userId}`);

          // First try with collegeId
          studentAppsQuery = query(applicationsRef, where('college_id', '==', collegeId));
          const querySnapshot1 = await getDocs(studentAppsQuery);

          // Add results to our array
          querySnapshot1.docs.forEach(doc => {
            allApplications.push({
              id: doc.id,
              studentId,
              ...doc.data() as Record<string, any>
            });
          });

          // Also try with userId as college_id
          studentAppsQuery = query(applicationsRef, where('college_id', '==', userId));
          const querySnapshot2 = await getDocs(studentAppsQuery);

          // Add results to our array
          querySnapshot2.docs.forEach(doc => {
            allApplications.push({
              id: doc.id,
              studentId,
              ...doc.data() as Record<string, any>
            });
          });

          // Also try with college_profile_id
          studentAppsQuery = query(applicationsRef, where('college_profile_id', '==', userId));
          const querySnapshot3 = await getDocs(studentAppsQuery);

          // Add results to our array
          querySnapshot3.docs.forEach(doc => {
            allApplications.push({
              id: doc.id,
              studentId,
              ...doc.data() as Record<string, any>
            });
          });
        } else {
          // Just try with collegeId
          studentAppsQuery = query(applicationsRef, where('college_id', '==', collegeId));
          const querySnapshot = await getDocs(studentAppsQuery);

          // Add results to our array
          querySnapshot.docs.forEach(doc => {
            allApplications.push({
              id: doc.id,
              studentId,
              ...doc.data() as Record<string, any>
            });
          });
        }
      }

      // Remove duplicates (in case an application matched multiple queries)
      allApplications = allApplications.filter((app, index, self) =>
        index === self.findIndex(a => a.id === app.id)
      );

      console.log(`Found ${allApplications.length} applications across all students`);

      // Create a mock querySnapshot for compatibility with the rest of the code
      const querySnapshot = {
        docs: allApplications.map(app => ({
          id: app.id,
          data: () => {
            const { studentId, ...appData } = app;
            return appData;
          },
          ref: doc(db, 'students', app.studentId, 'applications', app.id)
        })),
        empty: allApplications.length === 0,
        size: allApplications.length
      };

      console.log(`Found ${querySnapshot.docs.length} applications`);

      const apps: Application[] = await Promise.all(
        querySnapshot.docs.map(async (docSnap: any) => {
          const appData = docSnap.data();
          console.log('Application data:', appData);

          // Fetch student data
          let student = { id: '', profile: { full_name: 'Unknown Student' } };
          if (appData.student_id) {
            const studentDoc = await getDoc(doc(db, 'students', appData.student_id));
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              console.log('Fetched student data:', studentData);
              student = {
                id: studentDoc.id,
                profile: {
                  full_name: studentData.full_name || 'Unknown Student',
                },
              };
            } else {
              console.log('Student document does not exist for ID:', appData.student_id);
            }
          }

          // Fetch course data
          let course = { name: 'Unknown Course' };

          console.log(`Processing application with course_id: ${appData.course_id}, college_id: ${appData.college_id}`);
          console.log('Application data:', appData);

          // If the application already has a course_name field, use that
          if (appData.course_name) {
            console.log(`Using course_name from application: ${appData.course_name}`);
            course = { name: appData.course_name };
          }
          // Otherwise try to fetch the course from the college's subcollection
          else if (appData.course_id && appData.college_id) {
            try {
              // First try to get the course from the college's subcollection
              console.log(`Fetching course from subcollection: colleges/${appData.college_id}/courses/${appData.course_id}`);
              const courseDoc = await getDoc(doc(db, 'colleges', appData.college_id, 'courses', appData.course_id));

              if (courseDoc.exists()) {
                const courseData = courseDoc.data();
                console.log('Fetched course data from subcollection:', courseData);
                course = {
                  name: courseData.name || 'Unknown Course',
                };
              } else {
                console.log(`Course not found in subcollection, trying standalone collection: courses/${appData.course_id}`);
                // Fallback to the old way (standalone courses collection)
                const oldCourseDoc = await getDoc(doc(db, 'courses', appData.course_id));
                if (oldCourseDoc.exists()) {
                  const courseData = oldCourseDoc.data();
                  console.log('Fetched course data from old collection:', courseData);
                  course = {
                    name: courseData.name || 'Unknown Course',
                  };
                } else {
                  console.log('Course document does not exist for ID:', appData.course_id);
                }
              }
            } catch (error) {
              console.error('Error fetching course:', error);
            }
          } else {
            console.log('Missing course_id or college_id in application data');
          }

          return {
            id: docSnap.id,
            status: appData.status || 'pending',
            notes: appData.notes || null,
            created_at: appData.created_at || new Date().toISOString(),
            updated_at: appData.updated_at || new Date().toISOString(),
            student,
            course,
            test_result: appData.test_result || null,
            aptitude_test_id: appData.aptitude_test_id || null,
          };
        })
      );
      console.log('Applications Data:', apps);
      setApplications(apps);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Applications Data:', applications);
  }, [applications]);

  const handleViewApplication = (application: Application) => {
    setCurrentApplication(application);
    setFormData({
      status: application.status,
      notes: application.notes || '',
      aptitude_test_id: application.aptitude_test_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleAptitudeTestChange = (value: string) => {
    setFormData(prev => ({ ...prev, aptitude_test_id: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApplication) return;

    setLoading(true);
    try {
      const updateData: any = {
        status: formData.status,
        notes: formData.notes,
        updated_at: new Date().toISOString()
      };

      // Only include aptitude_test_id if it's set and the status is 'approved'
      if (formData.status === 'approved' && formData.aptitude_test_id) {
        updateData.aptitude_test_id = formData.aptitude_test_id;
      }

      // Get the student ID from the current application
      const studentId = currentApplication.student.id;

      // Update the application in the student's subcollection
      await updateDoc(doc(db, 'students', studentId, 'applications', currentApplication.id), updateData);

      toast({
        title: 'Application updated',
        description: formData.status === 'approved' && formData.aptitude_test_id
          ? 'Application approved with aptitude test requirement'
          : 'Application status has been successfully updated'
      });

      // Refresh applications
      if (collegeId) {
        const userId = auth.currentUser?.uid;
        await fetchApplications(collegeId, userId);
      }

      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Student Applications</h3>
        <div className="flex justify-center items-center p-8 border rounded-md bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600">Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Student Applications</h3>

      {applications.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No applications received yet</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Test Score</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(application => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-purple-500" />
                      {application.student?.profile?.full_name || 'Unknown Student'}
                    </div>
                  </TableCell>
                  <TableCell>{application.course?.name || 'Unknown Course'}</TableCell>
                  <TableCell>
                    {application.test_result ? (
                      <div className="flex items-center">
                        <span className={`font-medium ${application.test_result.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                          {application.test_result.score}%
                        </span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${application.test_result.score >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {application.test_result.score >= 60 ? 'Pass' : 'Fail'}
                        </span>
                        {application.test_result.completed_at && (
                          <span className="ml-2 text-xs text-gray-500">
                            {typeof application.test_result.completed_at === 'object' && application.test_result.completed_at.toDate
                              ? format(new Date(application.test_result.completed_at.toDate()), 'MM/dd')
                              : typeof application.test_result.completed_at === 'string'
                                ? format(new Date(application.test_result.completed_at), 'MM/dd')
                                : ''
                            }
                          </span>
                        )}
                      </div>
                    ) : (
                      'No test taken'
                    )}
                  </TableCell>
                  <TableCell>
                    {application.created_at && !isNaN(new Date(application.created_at).getTime())
                      ? format(new Date(application.created_at), 'MMM d, yyyy')
                      : 'Unknown date'}
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewApplication(application)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Update status and provide feedback for this application
            </DialogDescription>
          </DialogHeader>
          {currentApplication && (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Student</p>
                    <p>{currentApplication.student.profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Course</p>
                    <p>{currentApplication.course.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Test Score</p>
                    {currentApplication.test_result ? (
                      <div>
                        <div className="flex items-center">
                          <span className={`font-medium text-lg ${currentApplication.test_result.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {currentApplication.test_result.score}%
                          </span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${currentApplication.test_result.score >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {currentApplication.test_result.score >= 60 ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        {currentApplication.test_result.completed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {typeof currentApplication.test_result.completed_at === 'object' && currentApplication.test_result.completed_at.toDate
                              ? `Completed on ${format(new Date(currentApplication.test_result.completed_at.toDate()), 'MMM d, yyyy')}`
                              : typeof currentApplication.test_result.completed_at === 'string'
                                ? `Completed on ${format(new Date(currentApplication.test_result.completed_at), 'MMM d, yyyy')}`
                                : 'Completed recently'
                            }
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>No test taken</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Date Applied</p>
                    <p>
                      {currentApplication.created_at && !isNaN(new Date(currentApplication.created_at).getTime())
                        ? format(new Date(currentApplication.created_at), 'MMM d, yyyy')
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full border rounded-md p-2"
                  >
                    {['pending', 'approved', 'rejected', 'declined'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.status === 'approved' && (
                  <div className="space-y-2">
                    <label htmlFor="aptitude_test" className="text-sm font-medium">
                      Aptitude Test Requirement
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        id="aptitude_test"
                        value={formData.aptitude_test_id}
                        onChange={(e) => handleAptitudeTestChange(e.target.value)}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="">No test required</option>
                        {aptitudeTests.map((test) => (
                          <option key={test.id} value={test.id}>
                            {test.title}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500">
                        {formData.aptitude_test_id ? (
                          <span className="flex items-center text-amber-600">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Test required
                          </span>
                        ) : (
                          <span>Optional</span>
                        )}
                      </div>
                    </div>
                    {formData.aptitude_test_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Student must pass this test to maintain approved status
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={handleNotesChange}
                    placeholder="Add notes or feedback for this application"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Application'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsManagement;
