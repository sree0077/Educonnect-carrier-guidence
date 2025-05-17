
import React from 'react';
import DashboardComponent from '@/components/Dashboard';
import { Toaster } from "@/components/ui/toaster";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardComponent />
      <Toaster />
    </div>
  );
};

export default Dashboard;
