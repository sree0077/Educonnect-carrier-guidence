
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { School, MapPin, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type College = {
  id: string;
  name: string;
  description: string;
  location: string;
  country: string;
  logo_url: string | null;
};

const CollegeList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  
  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('*')
          .eq('is_verified', true);
          
        if (error) throw error;
        
        setColleges(data || []);
        setFilteredColleges(data || []);
      } catch (error: any) {
        console.error('Error fetching colleges:', error);
        toast({
          title: 'Error',
          description: 'Failed to load colleges',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchColleges();
  }, [toast]);
  
  useEffect(() => {
    // Apply filters whenever search term or location filter changes
    let results = colleges;
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(college => 
        college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply location filter
    if (locationFilter !== 'all') {
      results = results.filter(college => 
        college.country.toLowerCase() === locationFilter.toLowerCase()
      );
    }
    
    setFilteredColleges(results);
  }, [colleges, searchTerm, locationFilter]);
  
  const handleViewCollege = (collegeId: string) => {
    navigate(`/college/${collegeId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Get unique countries for the filter
  const countries = ['all', ...new Set(colleges.map(college => college.country.toLowerCase()))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search colleges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country} value={country}>
                  {country === 'all' ? 'All Locations' : country.charAt(0).toUpperCase() + country.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredColleges.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No colleges match your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredColleges.map(college => (
            <Card key={college.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{college.name}</CardTitle>
                  {college.logo_url && (
                    <img 
                      src={college.logo_url} 
                      alt={`${college.name} logo`} 
                      className="h-10 w-10 object-contain"
                    />
                  )}
                </div>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {college.location}, {college.country}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-500 line-clamp-3">
                  {college.description || "No description available"}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleViewCollege(college.id)}
                >
                  <School className="mr-2 h-4 w-4" />
                  View College
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollegeList;
