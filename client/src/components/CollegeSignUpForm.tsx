import React, { useState } from 'react';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Building, MapPin, X, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@config/firebase.config";
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const CollegeSignUpForm: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    collegeName: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    country: '',
  });

  const [errors, setErrors] = useState({
    collegeName: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    country: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      collegeName: '',
      email: '',
      password: '',
      confirmPassword: '',
      location: '',
      country: '',
    };

    // Validate college name
    if (!formData.collegeName.trim()) {
      newErrors.collegeName = 'College name is required';
      isValid = false;
    }

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Validate location
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
      isValid = false;
    }

    // Validate country
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
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

  // Function to recover an account if it exists in Auth but not in Firestore
  const recoverAccount = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Try to sign in with the provided credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the college document exists
      const collegeDocRef = doc(db, "colleges", user.uid);
      const collegeDoc = await getDoc(collegeDocRef);

      if (!collegeDoc.exists()) {
        // College document doesn't exist, create it
        await setDoc(collegeDocRef, {
          collegeName: formData.collegeName,
          email: formData.email,
          location: formData.location,
          country: formData.country,
          createdAt: new Date().toISOString(),
          user_type: "college",
          profile_id: user.uid,
          recovered: true // Mark as recovered
        });

        // Set user type in localStorage
        localStorage.setItem("userType", "college");

        toast({
          title: "Account recovered",
          description: "Your college account has been recovered successfully.",
          duration: 5000,
        });

        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // College document exists, just navigate to dashboard
        localStorage.setItem("userType", "college");
        toast({
          title: "Signed in",
          description: "You have been signed in to your college account.",
          duration: 5000,
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error("Error recovering account:", error);
      toast({
        title: "Recovery failed",
        description: "Could not recover your account. Please contact support.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setIsLoading(true);
        // Sign up the college with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;
        // Update display name
        await updateProfile(user, { displayName: formData.collegeName });
        // Store additional college info in Firestore
        await setDoc(doc(db, "colleges", user.uid), {
          collegeName: formData.collegeName,
          email: formData.email,
          location: formData.location,
          country: formData.country,
          createdAt: new Date().toISOString(),
          user_type: "college",
          profile_id: user.uid  // Add profile_id field to match query in Dashboard
        });

        // Explicitly set user type in localStorage
        localStorage.setItem("userType", "college");
        console.log("Set userType in localStorage to college during signup");
        toast({
          title: "Account created!",
          description: "Your college account has been created successfully.",
          duration: 5000,
        });
        setFormData({
          collegeName: '',
          email: '',
          password: '',
          confirmPassword: '',
          location: '',
          country: '',
        });
        navigate('/login');
      } catch (error: any) {
        console.error("Firebase Auth Error:", error); // Log the full error object

        // Check if the error is "email-already-in-use"
        if (error.code === "auth/email-already-in-use") {
          toast({
            title: "Email already in use",
            description: "This email is already registered. Would you like to sign in instead?",
            variant: "destructive",
            duration: 5000,
            action: (
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Try to recover the account
                    recoverAccount(formData.email, formData.password);
                  }}
                >
                  Recover Account
                </Button>
              </div>
            ),
          });
        } else {
          toast({
            title: "Error creating account",
            description: error.message || "There was a problem creating your account.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="auth-card animate-enter shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-purple-600">College Registration</CardTitle>
        <CardDescription>
          Register your institution to connect with prospective students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collegeName" className="form-label">College Name</Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Building size={18} />
              </div>
              <Input
                id="collegeName"
                name="collegeName"
                placeholder="Enter college name"
                className="form-input pl-10"
                value={formData.collegeName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.collegeName && (
              <div className="text-sm text-red-500 flex items-center mt-1">
                <X size={16} className="mr-1" /> {errors.collegeName}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="form-label">City/Location</Label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <MapPin size={18} />
                </div>
                <Input
                  id="location"
                  name="location"
                  placeholder="City/Location"
                  className="form-input pl-10"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.location && (
                <div className="text-sm text-red-500 flex items-center mt-1">
                  <X size={16} className="mr-1" /> {errors.location}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="form-label">Country</Label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <Globe size={18} />
                </div>
                <Input
                  id="country"
                  name="country"
                  placeholder="Country"
                  className="form-input pl-10"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {errors.country && (
                <div className="text-sm text-red-500 flex items-center mt-1">
                  <X size={16} className="mr-1" /> {errors.country}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="form-label">Official Email</Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Mail size={18} />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter institutional email"
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
            <Label htmlFor="password" className="form-label">Password</Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Lock size={18} />
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="form-label">Confirm Password</Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Lock size={18} />
              </div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="form-input pl-10"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <div className="text-sm text-red-500 flex items-center mt-1">
                <X size={16} className="mr-1" /> {errors.confirmPassword}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="btn-primary mt-6 w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Register Institution"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-purple-500 hover:underline font-medium">
            Sign In
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default CollegeSignUpForm;
