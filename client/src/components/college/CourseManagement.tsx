import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Select from '@/components/ui/select';
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
  DialogClose
} from '@/components/ui/dialog';
import { BookOpen, Edit, Trash, Plus } from 'lucide-react';
import { auth, db } from '@config/firebase.config';
import { collection, query, where, getDocs, addDoc, setDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type Career = {
  id: string;
  name: string;
};

// Add default careers
const defaultCareers: Omit<Career, 'id'>[] = [
  { name: "Computer Science & IT" },
  { name: "Engineering" },
  { name: "Business & Management" },
  { name: "Healthcare & Medicine" },
  { name: "Arts & Design" },
  { name: "Law & Legal Studies" },
  { name: "Education & Teaching" },
  { name: "Architecture" },
  { name: "Media & Communications" },
  { name: "Science & Research" },
  { name: "Social Sciences" },
  { name: "Hospitality & Tourism" },
  { name: "Agriculture & Environmental Science" },
  { name: "Aviation & Aerospace" },
  { name: "Finance & Accounting" }
];

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
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Get college id for this user
        const collegesRef = collection(db, 'colleges');
        const q = query(collegesRef, where('profile_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) throw new Error('College not found');
        const collegeId = querySnapshot.docs[0].id;
        setCollegeId(collegeId);
        // Get careers
        const careersRef = collection(db, 'careers');
        const careersSnapshot = await getDocs(careersRef);
        console.log('Careers from Firestore:', careersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (careersSnapshot.empty) {
          console.log('No careers found, initializing with defaults:', defaultCareers);
          // Initialize default careers
          const careerPromises = defaultCareers.map(career =>
            addDoc(careersRef, career)
          );
          await Promise.all(careerPromises);
          const updatedCareersSnapshot = await getDocs(careersRef);
          const updatedCareers = updatedCareersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Career[];
          console.log('Initialized careers:', updatedCareers);
          setCareers(updatedCareers);
        } else {
          const existingCareers = careersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Career[];
          console.log('Found existing careers:', existingCareers);
          setCareers(existingCareers);
        }
        // Get courses for this college
        await fetchCourses(collegeId);
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
    });
    return () => unsubscribe && unsubscribe();
  }, [toast]);

  const fetchCourses = async (collegeId: string) => {
    setLoading(true);
    try {
      // First try to get courses from the subcollection
      const coursesSubcollectionRef = collection(db, 'colleges', collegeId, 'courses');
      let querySnapshot = await getDocs(coursesSubcollectionRef);

      // If no courses found in subcollection, try the old way (for backward compatibility)
      if (querySnapshot.empty) {
        console.log('No courses found in subcollection, trying old collection...');
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, where('college_id', '==', collegeId));
        querySnapshot = await getDocs(q);

        // If courses found in old collection, migrate them to subcollection
        if (!querySnapshot.empty) {
          console.log('Found courses in old collection, migrating...');

          // Manually migrate courses from old collection to subcollection
          const coursesToMigrate = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as { college_id: string, [key: string]: any }
          }));

          console.log(`Migrating ${coursesToMigrate.length} courses to subcollection`);

          // Create batch for efficient writes
          const batch = writeBatch(db);

          // For each course, create a document in the subcollection
          for (const course of coursesToMigrate) {
            if (course.college_id === collegeId) {
              const newCourseRef = doc(collection(db, 'colleges', collegeId, 'courses'), course.id);
              // Remove the id field from the data (it's already in the document reference)
              const { id, ...courseData } = course;
              batch.set(newCourseRef, courseData);
            }
          }

          // Commit the batch
          await batch.commit();
          console.log('Migration completed successfully');

          // After migration, fetch from subcollection again
          querySnapshot = await getDocs(coursesSubcollectionRef);
        }
      }

      setCourses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId) return;
    setLoading(true);
    try {
      console.log('Form data being submitted:', formData);
      console.log('Available careers:', careers);
      // Find the selected career to get its name
      const selectedCareer = careers.find(career => career.id === formData.career_id);
      console.log('Selected career:', selectedCareer);

      if (!selectedCareer) {
        console.error('Career not found with ID:', formData.career_id);
        toast({
          title: 'Error',
          description: 'Please select a valid career field',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (!selectedCareer) {
        throw new Error('Selected career not found');
      }

      const courseData = {
        college_id: collegeId,
        career_id: formData.career_id,
        career_name: selectedCareer.name, // Add the career name
        name: formData.name,
        description: formData.description || null,
        duration: formData.duration || null,
        fees: formData.fees ? parseFloat(formData.fees) : null,
        admission_criteria: formData.admission_criteria || null,
        updated_at: new Date().toISOString()
      };
      if (isEditMode && currentCourse) {
        // Update existing course in subcollection
        const courseRef = doc(db, 'colleges', collegeId, 'courses', currentCourse.id);
        await setDoc(courseRef, courseData, { merge: true });
        toast({
          title: 'Course updated',
          description: 'Course has been successfully updated'
        });
      } else {
        // Add new course to subcollection
        const coursesRef = collection(db, 'colleges', collegeId, 'courses');
        await addDoc(coursesRef, {
          ...courseData,
          created_at: new Date().toISOString()
        });
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
    if (!collegeId) {
      toast({
        title: 'Error',
        description: 'College ID not found',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Delete from subcollection
      const courseRef = doc(db, 'colleges', collegeId, 'courses', courseId);
      await deleteDoc(courseRef);
      toast({
        title: 'Course deleted',
        description: 'Course has been successfully deleted'
      });
      // Refresh courses
      await fetchCourses(collegeId);
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
                    options={careers.map((career) => ({ value: career.id, label: career.name }))}
                    value={formData.career_id}
                    onChange={(value: string) => setFormData((prev) => ({ ...prev, career_id: value }))}
                    required
                  />
                  {careers.length === 0 && (
                    <p className="text-sm text-red-500">No career fields available. Please try refreshing the page.</p>
                  )}
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
