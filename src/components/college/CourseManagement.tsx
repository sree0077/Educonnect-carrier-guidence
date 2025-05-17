
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { BookOpen, Edit, Trash, Plus } from 'lucide-react';

type Career = {
  id: string;
  name: string;
};

type Course = {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  fees: number | null;
  admission_criteria: string | null;
  career_id: string;
  career_name: string;
};

const CourseManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    fees: '',
    admission_criteria: '',
    career_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Get college id
        const { data: collegeData, error: collegeError } = await supabase
          .from('colleges')
          .select('id')
          .eq('profile_id', session.user.id)
          .single();
          
        if (collegeError) throw collegeError;
        
        setCollegeId(collegeData.id);
        
        // Get careers
        const { data: careersData, error: careersError } = await supabase
          .from('careers')
          .select('id, name');
          
        if (careersError) throw careersError;
        
        setCareers(careersData || []);
        
        // Get courses for this college
        await fetchCourses(collegeData.id);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  const fetchCourses = async (collegeId: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id, 
          name, 
          description, 
          duration, 
          fees, 
          admission_criteria,
          career_id,
          careers!inner(name)
        `)
        .eq('college_id', collegeId);
        
      if (error) throw error;
      
      // Format the data
      const formattedCourses = data.map((course: any) => ({
        id: course.id,
        name: course.name,
        description: course.description,
        duration: course.duration,
        fees: course.fees,
        admission_criteria: course.admission_criteria,
        career_id: course.career_id,
        career_name: course.careers.name
      }));
      
      setCourses(formattedCourses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddCourse = () => {
    setIsEditMode(false);
    setCurrentCourse(null);
    setFormData({
      name: '',
      description: '',
      duration: '',
      fees: '',
      admission_criteria: '',
      career_id: ''
    });
    setIsDialogOpen(true);
  };
  
  const handleEditCourse = (course: Course) => {
    setIsEditMode(true);
    setCurrentCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      duration: course.duration || '',
      fees: course.fees?.toString() || '',
      admission_criteria: course.admission_criteria || '',
      career_id: course.career_id
    });
    setIsDialogOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, career_id: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId) return;
    
    setLoading(true);
    try {
      const courseData = {
        college_id: collegeId,
        career_id: formData.career_id,
        name: formData.name,
        description: formData.description || null,
        duration: formData.duration || null,
        fees: formData.fees ? parseFloat(formData.fees) : null,
        admission_criteria: formData.admission_criteria || null,
        updated_at: new Date().toISOString()
      };
      
      if (isEditMode && currentCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', currentCourse.id);
          
        if (error) throw error;
        
        toast({
          title: 'Course updated',
          description: 'Course has been successfully updated'
        });
      } else {
        // Add new course
        const { error } = await supabase
          .from('courses')
          .insert({
            ...courseData,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        toast({
          title: 'Course added',
          description: 'New course has been successfully added'
        });
      }
      
      // Refresh courses
      await fetchCourses(collegeId);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
        
      if (error) throw error;
      
      toast({
        title: 'Course deleted',
        description: 'Course has been successfully deleted'
      });
      
      // Refresh courses
      if (collegeId) {
        await fetchCourses(collegeId);
      }
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive'
      });
    }
  };

  if (loading && !collegeId) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Course Management</CardTitle>
        <Button onClick={handleAddCourse}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p className="text-gray-500">No courses added yet</p>
            <Button className="mt-4" onClick={handleAddCourse}>
              Add Your First Course
            </Button>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Career Field</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map(course => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4 text-purple-500" />
                        {course.name}
                      </div>
                    </TableCell>
                    <TableCell>{course.career_name}</TableCell>
                    <TableCell>{course.duration || 'N/A'}</TableCell>
                    <TableCell>
                      {course.fees ? `₹${course.fees.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCourse(course)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Course' : 'Add New Course'}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Update the details of your existing course' 
                  : 'Enter the details for your new course'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Course Name</label>
                  <Input 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Bachelor of Computer Science"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="career_id" className="text-sm font-medium">Career Field</label>
                  <Select 
                    value={formData.career_id} 
                    onValueChange={handleSelectChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a career field" />
                    </SelectTrigger>
                    <SelectContent>
                      {careers.map(career => (
                        <SelectItem key={career.id} value={career.id}>
                          {career.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea 
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the course curriculum and learning outcomes"
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="duration" className="text-sm font-medium">Duration</label>
                    <Input 
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 4 years"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="fees" className="text-sm font-medium">Fees (₹)</label>
                    <Input 
                      id="fees"
                      name="fees"
                      type="number"
                      value={formData.fees}
                      onChange={handleInputChange}
                      placeholder="e.g., 100000"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="admission_criteria" className="text-sm font-medium">Admission Criteria</label>
                  <Textarea 
                    id="admission_criteria"
                    name="admission_criteria"
                    value={formData.admission_criteria}
                    onChange={handleInputChange}
                    placeholder="Describe the requirements and selection process"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (isEditMode ? 'Update Course' : 'Add Course')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CourseManagement;
