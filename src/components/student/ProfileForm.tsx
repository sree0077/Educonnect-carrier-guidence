
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProfileForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    current_education: '',
    graduation_year: '',
    interests: '',
    preferred_location: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Get student-specific data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('profile_id', session.user.id)
          .single();
          
        if (studentError && studentError.code !== 'PGRST116') throw studentError;
        
        setProfile({
          full_name: profileData?.full_name || '',
          current_education: studentData?.current_education || '',
          graduation_year: studentData?.graduation_year?.toString() || '',
          interests: studentData?.interests?.join(', ') || '',
          preferred_location: studentData?.preferred_location || ''
        });
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: profile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
        
      if (profileError) throw profileError;
      
      // Update student data
      const interestsArray = profile.interests
        .split(',')
        .map(item => item.trim())
        .filter(item => item);
      
      const { error: studentError } = await supabase
        .from('students')
        .update({ 
          current_education: profile.current_education,
          graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
          interests: interestsArray,
          preferred_location: profile.preferred_location,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', session.user.id);
        
      if (studentError) throw studentError;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Student Profile</CardTitle>
        <CardDescription>Complete your profile to get personalized college recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">Full Name</label>
            <Input 
              id="full_name"
              name="full_name"
              value={profile.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="current_education" className="text-sm font-medium">Current Education</label>
            <Input 
              id="current_education"
              name="current_education"
              value={profile.current_education}
              onChange={handleChange}
              placeholder="e.g., High School, Bachelor's"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="graduation_year" className="text-sm font-medium">Expected Graduation Year</label>
            <Select 
              value={profile.graduation_year} 
              onValueChange={(value) => setProfile(prev => ({ ...prev, graduation_year: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="interests" className="text-sm font-medium">Interests (comma-separated)</label>
            <Textarea 
              id="interests"
              name="interests"
              value={profile.interests}
              onChange={handleChange}
              placeholder="e.g., Computer Science, Engineering, Business"
              disabled={loading}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="preferred_location" className="text-sm font-medium">Preferred Location</label>
            <Input 
              id="preferred_location"
              name="preferred_location"
              value={profile.preferred_location}
              onChange={handleChange}
              placeholder="e.g., India, United States, Europe"
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
