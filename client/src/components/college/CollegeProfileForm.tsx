import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { auth, db } from '@config/firebase.config';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const collegesRef = collection(db, 'colleges');
        const q = query(collegesRef, where('profile_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) throw new Error('College not found');
        const collegeDoc = querySnapshot.docs[0];
        const collegeData = collegeDoc.data();
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
    });
    return () => unsubscribe && unsubscribe();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      console.log('Saving college profile with data:', profile);
      console.log('Logo URL being saved:', profile.logo_url);

      const collegesRef = collection(db, 'colleges');
      const q = query(collegesRef, where('profile_id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        // Create new college document if not found
        const newDocRef = doc(collegesRef);
        await setDoc(newDocRef, { ...profile, profile_id: user.uid });
        console.log('Created new college document with ID:', newDocRef.id);
        toast({
          title: 'Success',
          description: 'Profile created successfully',
          variant: 'default'
        });
      } else {
        // Update existing college document
        const collegeDoc = querySnapshot.docs[0];
        await setDoc(collegeDoc.ref, { ...profile }, { merge: true });
        console.log('Updated existing college document with ID:', collegeDoc.id);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error updating college profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update college data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidImageUrl = (url: string) => {
    if (!url) return false;

    // Check if it's a direct image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext =>
      url.toLowerCase().includes(ext)
    );

    // Check if it's not a Google search URL or other problematic URLs
    const isGoogleUrl = url.includes('google.com/url');
    const isSocialMedia = url.includes('facebook.com') || url.includes('instagram.com') || url.includes('twitter.com');

    return hasImageExtension && !isGoogleUrl && !isSocialMedia;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));

    // Show warning for logo URL if it's not valid
    if (name === 'logo_url' && value && !isValidImageUrl(value)) {
      console.warn('Invalid image URL format:', value);
    }
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
              className={profile.logo_url && !isValidImageUrl(profile.logo_url) ? 'border-red-300' : ''}
            />
            <div className="text-xs mt-1">
              {profile.logo_url && !isValidImageUrl(profile.logo_url) && (
                <p className="text-red-500 mb-1">❌ Invalid image URL format</p>
              )}
              {profile.logo_url && isValidImageUrl(profile.logo_url) && (
                <p className="text-green-500 mb-1">✅ Valid image URL format</p>
              )}
              <div className="text-gray-500">
                <p>⚠️ Please use a direct image URL (ending with .jpg, .png, .gif, etc.)</p>
                <p>❌ Don't use Google search URLs or social media links</p>
                <p>✅ Example: https://your-website.com/logo.png</p>
              </div>
            </div>
            {profile.logo_url && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
                <div className="relative">
                  <img
                    src={profile.logo_url}
                    alt="Logo preview"
                    className="h-16 w-16 object-contain border border-gray-200 rounded"
                    onLoad={() => console.log('Logo preview loaded successfully')}
                    onError={(e) => {
                      console.error('Logo preview failed to load:', profile.logo_url);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Show error message
                      const errorDiv = target.nextElementSibling as HTMLElement;
                      if (errorDiv) errorDiv.style.display = 'block';
                    }}
                  />
                  <div
                    className="text-red-500 text-xs mt-1 hidden"
                    style={{ display: 'none' }}
                  >
                    ❌ Image failed to load. Please check the URL format.
                  </div>
                </div>
              </div>
            )}
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
