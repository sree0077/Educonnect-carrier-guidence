
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center animate-fade-in max-w-2xl">
        <h1 className="text-4xl font-bold mb-4 text-purple-600">Career Guidance Platform</h1>
        <p className="text-xl text-gray-600 mb-8">Your path to the perfect educational journey</p>
        
        <div className="space-y-6 mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-purple-500 mb-3">For Students</h2>
            <p className="text-gray-600 mb-4">Find the right college and career path with personalized guidance</p>
            <Link to="/signup">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-md">
                Student Sign Up
              </Button>
            </Link>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-semibold text-purple-500 mb-3">For Colleges</h2>
            <p className="text-gray-600 mb-4">Connect with prospective students and showcase your programs</p>
            <Link to="/college-signup">
              <Button className="bg-white hover:bg-gray-50 text-purple-600 border border-purple-300 px-6 py-2 rounded-md">
                College Sign Up
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-gray-500">Already have an account?</p>
          <Link to="/login">
            <Button variant="link" className="text-purple-500 hover:text-purple-700">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
