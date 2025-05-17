
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-purple-600">Career Guidance Platform</h1>
        <p className="text-xl text-gray-600 mb-8">Your path to the perfect educational journey</p>
        
        <div className="space-y-4">
          <Link to="/signup">
            <Button className="bg-purple-300 hover:bg-purple-400 text-white px-6 py-2 rounded-md mx-2">
              Student Sign Up
            </Button>
          </Link>
          <Button className="bg-white hover:bg-gray-50 text-purple-600 border border-purple-300 px-6 py-2 rounded-md mx-2">
            College Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
