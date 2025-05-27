import Button from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, School, BookOpen, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 hero-pattern">
        <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 text-center md:text-left animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-purple-600 mb-4">
                EduConnect
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Connect students with colleges through aptitude tests and streamlined applications. Your path to the perfect educational journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-md flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    Get Started <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-purple-300 text-purple-600 px-8 py-6 rounded-md hover:bg-purple-50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="w-full md:w-1/2 mt-12 md:mt-0 flex justify-center">
              <img
                src="/career-guidance.svg"
                alt="Career Guidance Illustration"
                className="max-w-full h-auto animate-float"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/phone-mockup.png";
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 wave-pattern"></div>
      </div>

      {/* Features Section */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <GraduationCap size={32} className="text-purple-500" />,
                title: "Take Aptitude Tests",
                description: "Discover your strengths and ideal career paths through our comprehensive tests."
              },
              {
                icon: <School size={32} className="text-purple-500" />,
                title: "Find Colleges",
                description: "Browse colleges that match your aptitude and career interests."
              },
              {
                icon: <BookOpen size={32} className="text-purple-500" />,
                title: "Review Programs",
                description: "Get details on courses, admission requirements, and career outcomes."
              },
              {
                icon: <Award size={32} className="text-purple-500" />,
                title: "Apply With Confidence",
                description: "Submit applications to programs that are the right fit for you."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For Students Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 animate-fade-in">
              <img
                src="/students.svg"
                alt="Students"
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
                }}
              />
            </div>
            <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl font-bold text-purple-600 mb-4">For Students</h2>
              <p className="text-lg text-gray-600 mb-6">
                Find the right college and career path with personalized guidance. Our platform helps you:
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Discover your aptitudes and interests through comprehensive tests",
                  "Explore colleges that match your profile and career goals",
                  "Get personalized recommendations for programs and courses",
                  "Track your applications in one convenient place"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-5 h-5 text-purple-500 mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                  Student Sign Up <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* For Colleges Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col-reverse md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl font-bold text-purple-600 mb-4">For Colleges</h2>
              <p className="text-lg text-gray-600 mb-6">
                Connect with prospective students and showcase your programs. Our platform helps you:
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Create detailed profiles of your institution and programs",
                  "Reach students who match your admission criteria",
                  "Manage and review applications efficiently",
                  "Communicate directly with interested applicants"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-5 h-5 text-purple-500 mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/college-signup">
                <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 flex items-center gap-2">
                  College Sign Up <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
            <div className="w-full md:w-1/2 animate-fade-in">
              <img
                src="/colleges.svg"
                alt="Colleges"
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80";
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sign Up Section */}
      <div className="py-16 bg-purple-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Join thousands of students and colleges already using our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8">
                Student Sign Up
              </Button>
            </Link>
            <Link to="/college-signup">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-purple-500 px-8">
                College Sign Up
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="text-white underline hover:text-purple-100">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">EduConnect</h3>
              <p className="text-gray-400">
                Connecting students with colleges through aptitude tests and streamlined applications
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Home', 'About', 'For Students', 'For Colleges', 'Blog'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                {['Career Guides', 'Aptitude Tests', 'College Directory', 'Admissions FAQ', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>info@careerguidance.com</li>
                <li>1-800-CAREER-1</li>
                <li>123 Education Ave, Learning City</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} EduConnect - Education Journey Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
