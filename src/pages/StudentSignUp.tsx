
import React from 'react';
import StudentSignUpForm from '@/components/StudentSignUpForm';
import { Toaster } from "@/components/ui/toaster";
import { Link } from 'react-router-dom';

const StudentSignUp: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Image and info */}
      <div className="hidden md:block w-1/2 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80')] bg-cover bg-center opacity-60"></div>
        
        <div className="relative h-full flex flex-col justify-center p-12 text-white z-10">
          <div className="animate-fade-in">
            <h2 className="text-4xl font-bold mb-6">Begin Your Educational Journey</h2>
            <p className="text-xl mb-8">
              Create your student account to discover colleges and programs that match your skills and career goals.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Take Aptitude Tests</h3>
                  <p className="text-white/80">Discover your strengths and ideal career paths</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Browse College Programs</h3>
                  <p className="text-white/80">Find programs that match your interests and aptitudes</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Apply and Track</h3>
                  <p className="text-white/80">Manage your applications in one convenient dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center">
            <Link to="/">
              <h2 className="text-center text-3xl font-extrabold text-purple-600 animate-fade-in">
                Career Guidance
              </h2>
            </Link>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Your path to the perfect educational journey
          </p>
          
          <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <StudentSignUpForm />
          </div>
          
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm text-gray-500">
              By signing up, you agree to our{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export default StudentSignUp;
