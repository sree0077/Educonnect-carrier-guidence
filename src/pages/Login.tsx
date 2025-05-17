
import React from 'react';
import LoginForm from '@/components/LoginForm';
import { Toaster } from "@/components/ui/toaster";

const Login: React.FC = () => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h2 className="text-center text-3xl font-extrabold text-purple-600">
          Career Guidance
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your path to the perfect educational journey
        </p>
      </div>
      
      <LoginForm />
      
      <Toaster />
    </div>
  );
};

export default Login;
