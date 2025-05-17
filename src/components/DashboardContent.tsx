
import React, { useState } from 'react';
import ProfileForm from '@/components/student/ProfileForm';
import CollegeProfileForm from '@/components/college/CollegeProfileForm';
import AptitudeTestList from '@/components/student/AptitudeTestList';
import CollegeList from '@/components/student/CollegeList';
import ApplicationsTable from '@/components/student/ApplicationsTable';
import CourseManagement from '@/components/college/CourseManagement';
import ApplicationsManagement from '@/components/college/ApplicationsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DashboardContentProps = {
  userType: string;
};

const DashboardContent: React.FC<DashboardContentProps> = ({ userType }) => {
  const [activeTab, setActiveTab] = useState(userType === 'student' ? 'profile' : 'college-profile');

  if (userType === 'student') {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tests">Aptitude Tests</TabsTrigger>
          <TabsTrigger value="colleges">Colleges</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <ProfileForm />
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-4">
          <AptitudeTestList />
        </TabsContent>
        
        <TabsContent value="colleges" className="space-y-4">
          <CollegeList />
        </TabsContent>
        
        <TabsContent value="applications" className="space-y-4">
          <ApplicationsTable />
        </TabsContent>
      </Tabs>
    );
  }
  
  if (userType === 'college') {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="college-profile">College Profile</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="student-applications">Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="college-profile" className="space-y-4">
          <CollegeProfileForm />
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-4">
          <CourseManagement />
        </TabsContent>
        
        <TabsContent value="student-applications" className="space-y-4">
          <ApplicationsManagement />
        </TabsContent>
      </Tabs>
    );
  }
  
  return (
    <div className="text-center p-8">
      <p className="text-lg text-gray-500">Dashboard content for {userType} not available</p>
    </div>
  );
};

export default DashboardContent;
