
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const StudentSignUpForm: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Form is valid, show success toast
      toast({
        title: "Account created!",
        description: "Your student account has been created successfully.",
        duration: 5000,
      });
      console.log('Form submitted:', formData);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    }
  };

  return (
    <Card className="auth-card animate-enter shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-purple-600">Student Sign Up</CardTitle>
        <CardDescription>
          Create an account to access career guidance resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="form-label">Full Name</Label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <User size={18} />
              </div>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                className="form-input pl-10"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            {errors.name && (
              <div className="text-sm text-red-500 flex items-center mt-1">
                <X size={16} className="mr-1" /> {errors.name}
              </div>
            )}
          </div>
          
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
              />
            </div>
            {errors.confirmPassword && (
              <div className="text-sm text-red-500 flex items-center mt-1">
                <X size={16} className="mr-1" /> {errors.confirmPassword}
              </div>
            )}
          </div>
          
          <Button type="submit" className="btn-primary mt-6">
            Create Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <a href="#" className="text-purple-500 hover:underline font-medium">
            Sign In
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default StudentSignUpForm;
