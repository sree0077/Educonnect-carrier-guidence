
import React from 'react';
import DashboardComponent from '@/components/Dashboard';
import { Toaster } from "@/components/ui/toaster";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-fade-in">
        <DashboardComponent />
      </div>
      <Toaster />
    </div>
  );
};

export default Dashboard;
