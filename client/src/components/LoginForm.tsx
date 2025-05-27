import React, { useState } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@config/firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LoginForm: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    form: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
      form: '',
    };

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setIsLoading(true);
        // Sign in the user with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Check user type to determine if they're a student or college
        let userType = "student"; // Default to student

        try {
          // First check if user is a college
          const collegeDoc = await getDoc(doc(db, "colleges", user.uid));
          if (collegeDoc.exists()) {
            userType = "college";
            console.log("User identified as college");

            // Force set the user type in localStorage
            localStorage.setItem("userType", "college");
            console.log("Set userType in localStorage to college");
          } else {
            // Then check if user is a student
            const studentDoc = await getDoc(doc(db, "students", user.uid));
            if (studentDoc.exists()) {
              userType = "student";
              console.log("User identified as student");

              // Force set the user type in localStorage
              localStorage.setItem("userType", "student");
              console.log("Set userType in localStorage to student");
            } else {
              // If no document found in either collection, we need to recover the account
              console.log("No document found for user, attempting to recover");

              // Check if the email suggests a college
              const email = user.email || "";
              const isLikelyCollege = email.includes(".edu") ||
                                     email.includes("college") ||
                                     email.includes("university") ||
                                     user.displayName?.toLowerCase().includes("college") ||
                                     user.displayName?.toLowerCase().includes("university");

              if (isLikelyCollege) {
                userType = "college";
                console.log("Detected as college based on email/name");
                localStorage.setItem("userType", "college");

                // Create a new college document
                await setDoc(doc(db, "colleges", user.uid), {
                  collegeName: user.displayName || email.split("@")[0],
                  email: email,
                  location: "",
                  country: "",
                  createdAt: new Date().toISOString(),
                  user_type: "college",
                  profile_id: user.uid,
                  recovered: true // Mark as recovered
                });

                toast({
                  title: "Account recovered",
                  description: "Your college account has been recovered. Please update your profile.",
                  duration: 5000,
                });
              } else {
                userType = "student";
                console.log("No indicators found, defaulting to student");
                localStorage.setItem("userType", "student");

                // Create a new student document
                await setDoc(doc(db, "students", user.uid), {
                  name: user.displayName || email.split("@")[0],
                  email: email,
                  createdAt: new Date().toISOString(),
                  user_type: "student",
                  profile_id: user.uid,
                  full_name: user.displayName || email.split("@")[0],
                  recovered: true // Mark as recovered
                });

                toast({
                  title: "Account recovered",
                  description: "Your student account has been recovered. Please update your profile.",
                  duration: 5000,
                });
              }
            }
          }
        } catch (profileError) {
          console.error("Error checking user type:", profileError);
          // Continue with default student type if there's an error
          localStorage.setItem("userType", "student");
        }

        toast({
          title: "Login successful!",
          description: `Welcome back! You are logged in as a ${userType}.`,
          duration: 4000,
        });

        // Store user type in localStorage for reference
        localStorage.setItem("userType", userType);

        navigate("/dashboard");
      } catch (error: any) {
        toast({
          title: "Login failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="auth-card animate-enter shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-purple-600">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200 flex items-center">
              <X size={16} className="mr-2" /> {errors.form}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="form-label">Email</Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Mail size={18} />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="form-input pl-10"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <div className="text-sm text-red-500 flex items-center mt-1">
                <X size={16} className="mr-1" /> {errors.email}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="form-label">Password</Label>
              <a href="/forgot-password" className="text-xs text-purple-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Lock size={18} />
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="form-input pl-10"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <div className="text-sm text-red-500 flex items-center mt-1">
                <X size={16} className="mr-1" /> {errors.password}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="btn-primary mt-6 w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="/signup" className="text-purple-500 hover:underline font-medium">
            Sign Up
          </a>
          {" | "}
          <a href="/college-signup" className="text-purple-500 hover:underline font-medium">
            College Sign Up
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
