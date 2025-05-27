
import React from 'react';
import LoginForm from '@/components/LoginForm';
import { Toaster } from "@/components/ui/toaster";
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
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
            <LoginForm />
          </div>
        </div>
      </div>
      
      {/* Right side - Image and info */}
      <div className="hidden md:block w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80')] bg-cover bg-center opacity-60"></div>
        
        <div className="relative h-full flex flex-col justify-center p-12 text-white z-10">
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-4xl font-bold mb-6">Welcome Back!</h2>
            <p className="text-xl mb-8">
              Sign in to continue your journey toward finding the perfect educational path.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Personalized Recommendations</h3>
                  <p className="text-white/80">Get college and career suggestions tailored to your skills and interests</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Track Your Applications</h3>
                  <p className="text-white/80">Manage all your college applications in one convenient dashboard</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Connect With Colleges</h3>
                  <p className="text-white/80">Direct communication with admissions offices for better engagement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export default Login;
