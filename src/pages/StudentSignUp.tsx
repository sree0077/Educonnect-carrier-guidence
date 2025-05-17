
import React from 'react';
import StudentSignUpForm from '@/components/StudentSignUpForm';
import { Toaster } from "@/components/ui/toaster";

const StudentSignUp: React.FC = () => {
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
      
      <StudentSignUpForm />
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          By signing up, you agree to our{" "}
          <a href="#" className="text-blue-400 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-400 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
      <Toaster />
    </div>
  );
};

export default StudentSignUp;
