import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentSignUp from "./pages/StudentSignUp";
import CollegeSignUp from "./pages/CollegeSignUp";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import College from "./pages/College";
import Test from "./pages/Test";
import TestResults from "./pages/TestResults";
import QuestionManagement from "./pages/QuestionManagement";
import QuestionsList from "./pages/QuestionsList";
import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@config/firebase.config";

const queryClient = new QueryClient();



// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => {
  // Set the document title
  useEffect(() => {
    document.title = "EduConnect - Education Journey Platform";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<StudentSignUp />} />
        <Route path="/college-signup" element={<CollegeSignUp />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/college/:id"
          element={<College />}
        />
        <Route
          path="/test/:id"
          element={
            <ProtectedRoute>
              <Test />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/results/:id"
          element={
            <ProtectedRoute>
              <TestResults />
            </ProtectedRoute>
          }
        />
        <Route path="/QuestionManagement" element={<QuestionManagement />} />
        <Route path="/QuestionManagement/:id" element={<QuestionManagement />} />
        <Route path="/QuestionsList" element={<QuestionsList />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
