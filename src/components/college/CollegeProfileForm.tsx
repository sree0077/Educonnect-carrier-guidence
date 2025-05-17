
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CollegeProfileForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    country: '',
    address: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    logo_url: ''
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
        
        // Get college-specific data
        const { data: collegeData, error: collegeError } = await supabase
          .from('colleges')
          .select('*')
          .eq('profile_id', session.user.id)
          .single();
          
        if (collegeError) throw collegeError;
        
        setProfile({
          name: collegeData?.name || '',
          description: collegeData?.description || '',
          location: collegeData?.location || '',
          country: collegeData?.country || '',
          address: collegeData?.address || '',
          website: collegeData?.website || '',
          contact_email: collegeData?.contact_email || '',
          contact_phone: collegeData?.contact_phone || '',
          logo_url: collegeData?.logo_url || ''
        });
      } catch (error: any) {
        console.error('Error fetching college profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load college data',
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
      
      // Update college data
      const { error } = await supabase
        .from('colleges')
        .update({ 
          name: profile.name,
          description: profile.description,
          location: profile.location,
          country: profile.country,
          address: profile.address,
          website: profile.website,
          contact_email: profile.contact_email,
          contact_phone: profile.contact_phone,
          logo_url: profile.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', session.user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your college profile has been successfully updated'
      });
    } catch (error: any) {
      console.error('Error updating college profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update college profile',
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>College Profile</CardTitle>
        <CardDescription>Update your college information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">College Name</label>
            <Input 
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              placeholder="College name"
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea 
              id="description"
              name="description"
              value={profile.description}
              onChange={handleChange}
              placeholder="Brief description of your college"
              disabled={loading}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location (City)</label>
              <Input 
                id="location"
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="City"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">Country</label>
              <Input 
                id="country"
                name="country"
                value={profile.country}
                onChange={handleChange}
                placeholder="Country"
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">Address</label>
            <Input 
              id="address"
              name="address"
              value={profile.address}
              onChange={handleChange}
              placeholder="Full address"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium">Website</label>
            <Input 
              id="website"
              name="website"
              type="url"
              value={profile.website}
              onChange={handleChange}
              placeholder="https://www.example.edu"
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="contact_email" className="text-sm font-medium">Contact Email</label>
              <Input 
                id="contact_email"
                name="contact_email"
                type="email"
                value={profile.contact_email}
                onChange={handleChange}
                placeholder="admissions@example.edu"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="contact_phone" className="text-sm font-medium">Contact Phone</label>
              <Input 
                id="contact_phone"
                name="contact_phone"
                value={profile.contact_phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="logo_url" className="text-sm font-medium">Logo URL</label>
            <Input 
              id="logo_url"
              name="logo_url"
              type="url"
              value={profile.logo_url}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CollegeProfileForm;
