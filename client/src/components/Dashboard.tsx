import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, School, GraduationCap, Award, User, TrendingUp, CheckCircle, Clock, FileText } from 'lucide-react';
import DashboardContent from '@/components/DashboardContent';
import { auth, db } from "@config/firebase.config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query as firestoreQuery, where, getDocs, doc, getDoc } from "firebase/firestore";

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalTests: 0,
    completedTests: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    declinedApplications: 0,
    averageScore: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalAptitudeTests: 0
  });

  // Function to fetch dashboard statistics for students
  const fetchDashboardStats = async (userId: string) => {
    try {
      // Get student document
      const studentsRef = collection(db, 'students');
      const studentQuery = firestoreQuery(studentsRef, where('profile_id', '==', userId));
      const studentSnapshot = await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        console.log('Student not found for dashboard stats');
        return;
      }

      const studentDoc = studentSnapshot.docs[0];
      const studentId = studentDoc.id;

      // Fetch applications
      const applicationsRef = collection(db, 'students', studentId, 'applications');
      const applicationsSnapshot = await getDocs(applicationsRef);

      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Count application statuses
      const totalApplications = applications.length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const approvedApplications = applications.filter(app => app.status === 'approved').length;
      const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
      const declinedApplications = applications.filter(app => app.status === 'declined').length;

      // Fetch test results
      const testResultsRef = collection(db, 'test_results');
      const testResultsQuery = firestoreQuery(testResultsRef, where('student_id', '==', studentId));
      const testResultsSnapshot = await getDocs(testResultsQuery);

      const testResults = testResultsSnapshot.docs.map(doc => doc.data());
      const completedTests = testResults.length;

      // Calculate average score
      const totalScore = testResults.reduce((sum, result) => sum + (result.score || 0), 0);
      const averageScore = completedTests > 0 ? Math.round(totalScore / completedTests) : 0;

      // Get total available tests - check both general tests and application-specific tests
      const aptitudeTestsRef = collection(db, 'aptitude_tests');
      const aptitudeTestsSnapshot = await getDocs(aptitudeTestsRef);

      // Also check for tests assigned to student's applications
      let applicationTests = 0;
      for (const app of applications) {
        if (app.aptitude_test_id) {
          applicationTests++;
        }
      }

      // Total tests = general aptitude tests + application-specific tests
      const totalTests = Math.max(aptitudeTestsSnapshot.docs.length, completedTests, applicationTests);

      console.log('Dashboard Stats Debug:', {
        generalAptitudeTests: aptitudeTestsSnapshot.docs.length,
        applicationTests,
        completedTests,
        totalTests,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        declinedApplications,
        averageScore
      });

      setDashboardStats({
        totalTests,
        completedTests,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        declinedApplications,
        averageScore,
        totalCourses: 0, // Not applicable for students
        activeCourses: 0, // Not applicable for students
        totalAptitudeTests: 0 // Not applicable for students
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Function to fetch dashboard statistics for colleges
  const fetchCollegeDashboardStats = async (userId: string) => {
    try {
      // Get college document
      const collegeDocRef = doc(db, 'colleges', userId);
      const collegeDoc = await getDoc(collegeDocRef);

      let collegeId: string;

      if (collegeDoc.exists()) {
        collegeId = userId;
      } else {
        // Fallback to query by profile_id
        const collegesRef = collection(db, 'colleges');
        const collegeQuery = firestoreQuery(collegesRef, where('profile_id', '==', userId));
        const collegeSnapshot = await getDocs(collegeQuery);

        if (collegeSnapshot.empty) {
          console.log('College not found for dashboard stats');
          return;
        }

        collegeId = collegeSnapshot.docs[0].id;
      }

      // Fetch all applications across all students for this college
      const studentsRef = collection(db, 'students');
      const studentsSnapshot = await getDocs(studentsRef);

      let allApplications: any[] = [];

      for (const studentDoc of studentsSnapshot.docs) {
        const applicationsRef = collection(db, 'students', studentDoc.id, 'applications');
        const applicationsSnapshot = await getDocs(applicationsRef);

        for (const appDoc of applicationsSnapshot.docs) {
          const appData = appDoc.data();
          if (appData.college_id === collegeId) {
            allApplications.push({
              id: appDoc.id,
              ...appData
            });
          }
        }
      }

      // Count application statuses
      const totalApplications = allApplications.length;
      const pendingApplications = allApplications.filter(app => app.status === 'pending').length;
      const approvedApplications = allApplications.filter(app => app.status === 'approved').length;
      const rejectedApplications = allApplications.filter(app => app.status === 'rejected').length;
      const declinedApplications = allApplications.filter(app => app.status === 'declined').length;

      // Get total courses for this college
      const coursesRef = collection(db, 'colleges', collegeId, 'courses');
      const coursesSnapshot = await getDocs(coursesRef);
      const totalCourses = coursesSnapshot.docs.length;

      // Count active courses (assuming all courses are active for now, can be enhanced later)
      const activeCourses = coursesSnapshot.docs.filter(doc => {
        const courseData = doc.data();
        return courseData.status !== 'inactive'; // Assuming courses have a status field
      }).length;

      // Get total aptitude tests for this college
      const aptitudeTestsRef = collection(db, 'aptitude_tests');
      const aptitudeTestsQuery = firestoreQuery(aptitudeTestsRef, where('college_id', '==', collegeId));
      const aptitudeTestsSnapshot = await getDocs(aptitudeTestsQuery);
      const totalAptitudeTests = aptitudeTestsSnapshot.docs.length;

      console.log('College Dashboard Stats Debug:', {
        collegeId,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        declinedApplications,
        totalCourses,
        activeCourses,
        totalAptitudeTests
      });

      setDashboardStats({
        totalTests: 0, // Not applicable for colleges
        completedTests: 0, // Not applicable for colleges
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        declinedApplications,
        averageScore: 0, // Not applicable for colleges
        totalCourses,
        activeCourses,
        totalAptitudeTests
      });

    } catch (error) {
      console.error('Error fetching college dashboard stats:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        // Fetch user profile from Firestore
        let userType = null;
        let profileData = null;
        // First try to get the document directly using user.uid as the document ID
        try {
          // Try student profile first
          const studentDocRef = doc(db, "students", user.uid);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
            profileData = studentDoc.data();
            userType = "student";
            console.log("Found student profile by document ID");
          } else {
            // Try college profile
            const collegeDocRef = doc(db, "colleges", user.uid);
            const collegeDoc = await getDoc(collegeDocRef);

            if (collegeDoc.exists()) {
              profileData = collegeDoc.data();
              userType = "college";
              console.log("Found college profile by document ID");
            }
          }
        } catch (error) {
          console.error("Error fetching profile by document ID:", error);
        }

        // If not found by document ID, try using profile_id field as fallback
        if (!profileData) {
          // Try student profile (by profile_id field)
          const studentsRef = collection(db, "students");
          const studentQuery = firestoreQuery(studentsRef, where("profile_id", "==", user.uid));
          const studentSnapshot = await getDocs(studentQuery);

          if (!studentSnapshot.empty) {
            profileData = studentSnapshot.docs[0].data();
            userType = "student";
            console.log("Found student profile by profile_id field");
          } else {
            // Try college profile (by profile_id field)
            const collegesRef = collection(db, "colleges");
            const collegeQuery = firestoreQuery(collegesRef, where("profile_id", "==", user.uid));
            const collegeSnapshot = await getDocs(collegeQuery);

            if (!collegeSnapshot.empty) {
              profileData = collegeSnapshot.docs[0].data();
              userType = "college";
              console.log("Found college profile by profile_id field");
            }
          }
        }

        // If still no profile found, check localStorage or other indicators
        if (!profileData && userType === null) {
          // First check localStorage for userType (set during login)
          const storedUserType = localStorage.getItem("userType");
          if (storedUserType === "college" || storedUserType === "student") {
            userType = storedUserType;
            console.log(`Using user type from localStorage: ${userType}`);
          } else {
            // Check if the email domain suggests this is a college
            const email = user.email || "";
            const isLikelyCollege = email.includes(".edu") ||
                                   email.includes("college") ||
                                   email.includes("university") ||
                                   user.displayName?.toLowerCase().includes("college") ||
                                   user.displayName?.toLowerCase().includes("university");

            if (isLikelyCollege) {
              userType = "college";
              console.log("Detected as college based on email/name");
            } else {
              // Check if the user has a document in the colleges collection
              try {
                const collegeDocRef = doc(db, "colleges", user.uid);
                const collegeDoc = await getDoc(collegeDocRef);
                if (collegeDoc.exists()) {
                  userType = "college";
                  console.log("Found document in colleges collection, setting as college");
                } else {
                  userType = "student";
                  console.log("No college document found, defaulting to student type");
                }
              } catch (error) {
                console.error("Error checking college document:", error);
                userType = "student";
                console.log("Error occurred, defaulting to student type");
              }
            }
          }

          // Store the determined user type in localStorage for future reference
          localStorage.setItem("userType", userType);

          setUserProfile({
            email: user.email,
            user_type: userType,
            full_name: user.displayName || ""
          });
          return;
        }
        if (!profileData) {
          throw new Error("Profile not found");
        }
        setUserProfile({ ...profileData, email: user.email, user_type: userType });

        // Fetch dashboard statistics based on user type
        if (userType === 'student') {
          await fetchDashboardStats(user.uid);
        } else if (userType === 'college') {
          await fetchCollegeDashboardStats(user.uid);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load your profile information.',
          variant: 'destructive'
        });
        navigate('/login');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
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

  const handleCardClick = (tabName: string) => {
    // This will trigger the tab change in DashboardContent
    const event = new CustomEvent('changeTab', { detail: tabName });
    window.dispatchEvent(event);
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center">
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 border-l-indigo-500"
            onClick={() => handleCardClick('profile')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <User size={20} className="mr-2 text-indigo-500" />
                Profile
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-semibold">Name:</span> {
                  userProfile?.user_type === 'college'
                    ? (userProfile?.name || userProfile?.collegeName || 'Not provided')
                    : (userProfile?.full_name || 'Not provided')
                }</p>
                <p><span className="font-semibold">Email:</span> {userProfile?.email}</p>
                <p><span className="font-semibold">Account Type:</span> {userProfile?.user_type}</p>
              </div>
            </CardContent>
          </Card>

          {isStudent && (
            <>
              {/* Aptitude Tests Card */}
              <Card
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 border-l-purple-500"
                onClick={() => handleCardClick('tests')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Award size={20} className="mr-2 text-purple-500" />
                      Aptitude Tests
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardStats.completedTests}/{dashboardStats.totalTests}
                    </div>
                  </CardTitle>
                  <CardDescription>Tests completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <CheckCircle size={16} className="mr-1 text-green-500" />
                        Completed
                      </span>
                      <span className="font-semibold">{dashboardStats.completedTests}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Clock size={16} className="mr-1 text-orange-500" />
                        Remaining
                      </span>
                      <span className="font-semibold">{dashboardStats.totalTests - dashboardStats.completedTests}</span>
                    </div>
                    {dashboardStats.averageScore > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <TrendingUp size={16} className="mr-1 text-blue-500" />
                          Average Score
                        </span>
                        <span className="font-semibold">{dashboardStats.averageScore}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Applications Card */}
              <Card
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => handleCardClick('applications')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <School size={20} className="mr-2 text-blue-500" />
                      Applications
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardStats.totalApplications}
                    </div>
                  </CardTitle>
                  <CardDescription>Total applications submitted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Clock size={16} className="mr-1 text-yellow-500" />
                        Pending
                      </span>
                      <span className="font-semibold">{dashboardStats.pendingApplications}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <CheckCircle size={16} className="mr-1 text-green-500" />
                        Approved
                      </span>
                      <span className="font-semibold">{dashboardStats.approvedApplications}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <FileText size={16} className="mr-1 text-red-500" />
                        Rejected
                      </span>
                      <span className="font-semibold">{dashboardStats.rejectedApplications}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <FileText size={16} className="mr-1 text-gray-500" />
                        Declined
                      </span>
                      <span className="font-semibold">{dashboardStats.declinedApplications}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </>
          )}

          {isCollege && (
            <>
              {/* Courses Card */}
              <Card
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 border-l-purple-500"
                onClick={() => handleCardClick('courses')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen size={20} className="mr-2 text-purple-500" />
                      Courses
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardStats.totalCourses}
                    </div>
                  </CardTitle>
                  <CardDescription>Manage your course offerings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <CheckCircle size={16} className="mr-1 text-green-500" />
                        Active Courses
                      </span>
                      <span className="font-semibold">{dashboardStats.activeCourses}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Award size={16} className="mr-1 text-blue-500" />
                        Aptitude Tests
                      </span>
                      <span className="font-semibold">{dashboardStats.totalAptitudeTests}</span>
                    </div>
                    {dashboardStats.totalCourses === 0 && (
                      <p className="text-xs text-gray-500 mt-2">Add courses to start receiving applications</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Applications Card */}
              <Card
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => handleCardClick('applications')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <GraduationCap size={20} className="mr-2 text-blue-500" />
                      Applications
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardStats.totalApplications}
                    </div>
                  </CardTitle>
                  <CardDescription>Student applications received</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <Clock size={16} className="mr-1 text-yellow-500" />
                        Pending
                      </span>
                      <span className="font-semibold">{dashboardStats.pendingApplications}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <CheckCircle size={16} className="mr-1 text-green-500" />
                        Approved
                      </span>
                      <span className="font-semibold">{dashboardStats.approvedApplications}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <FileText size={16} className="mr-1 text-red-500" />
                        Rejected
                      </span>
                      <span className="font-semibold">{dashboardStats.rejectedApplications}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center">
                        <FileText size={16} className="mr-1 text-gray-500" />
                        Declined
                      </span>
                      <span className="font-semibold">{dashboardStats.declinedApplications}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </>
          )}
        </div>

        <DashboardContent userType={userProfile?.user_type} />

        <div className="bg-purple-50 border border-purple-100 rounded-lg p-6 mt-8">
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
                <span>Explore colleges offering courses aligned with your interests</span>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                  <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">3</span>
                </div>
                <span>Apply to colleges and track your application status</span>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-200 rounded-full p-1 mr-3 mt-0.5">
                  <span className="block h-4 w-4 text-xs text-center font-bold text-purple-700">4</span>
                </div>
                <span>Take the aptitude test to discover careers that match your skills</span>
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
                <span>Review and process student applications and conduct Aptitude test</span>
              </li>
            </ul>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Dashboard;
