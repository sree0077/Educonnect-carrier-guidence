import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { auth, db } from '@config/firebase.config';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import TestQuestionManager from './TestQuestionManager';

const AptitudeTestManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [editingTest, setEditingTest] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showQuestionManager, setShowQuestionManager] = useState(false);

  useEffect(() => {
    // Get the current college ID
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        console.log('Getting college ID for user:', user.uid);

        // First try to get the college document directly using user.uid
        const collegeDocRef = doc(db, 'colleges', user.uid);
        const collegeDoc = await getDoc(collegeDocRef);

        let effectiveCollegeId;

        if (collegeDoc.exists()) {
          // Use the user.uid as the college ID
          effectiveCollegeId = user.uid;
          console.log('Found college document directly with ID:', effectiveCollegeId);
        } else {
          // Fallback to query by profile_id
          const collegesRef = collection(db, 'colleges');
          const q = query(collegesRef, where('profile_id', '==', user.uid));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            console.error('College not found for user:', user.uid);

            // As a last resort, use the user.uid directly
            effectiveCollegeId = user.uid;
            console.log('Using user.uid as fallback college ID:', effectiveCollegeId);
          } else {
            effectiveCollegeId = querySnapshot.docs[0].id;
            console.log('Found college by profile_id query with ID:', effectiveCollegeId);
          }
        }

        // Also store in localStorage for other components to use
        localStorage.setItem('currentCollegeId', effectiveCollegeId);
        console.log('Stored college ID in localStorage:', effectiveCollegeId);

        setCollegeId(effectiveCollegeId);

        // Fetch tests for this college
        await fetchTests(effectiveCollegeId);

        // Also try fetching with user.uid as college_id
        if (effectiveCollegeId !== user.uid) {
          console.log('Also checking for tests with user.uid as college_id');
          await fetchTestsWithUserId(user.uid);
        }
      } catch (error) {
        console.error('Error getting college ID:', error);
        toast({
          title: 'Error',
          description: 'Failed to load college information',
          variant: 'destructive'
        });
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const fetchTests = async (collegeId: string) => {
    try {
      console.log('Fetching tests for college ID:', collegeId);

      // Get tests created by this college
      const testsQuery = query(
        collection(db, 'aptitude_tests'),
        where('college_id', '==', collegeId)
      );
      const testsSnapshot = await getDocs(testsQuery);
      const testsData = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`Found ${testsData.length} tests for college ID ${collegeId}:`, testsData);

      setTests(testsData);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchTestsWithUserId = async (userId: string) => {
    try {
      console.log('Fetching tests with user ID as college_id:', userId);

      // Get tests created with user.uid as college_id
      const testsQuery = query(
        collection(db, 'aptitude_tests'),
        where('college_id', '==', userId)
      );
      const testsSnapshot = await getDocs(testsQuery);
      const testsData = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`Found ${testsData.length} tests with user ID ${userId} as college_id:`, testsData);

      // If we found tests and the current tests array is empty, use these tests
      if (testsData.length > 0) {
        setTests(currentTests => {
          // If we already have tests, combine them without duplicates
          if (currentTests.length > 0) {
            // Create a map of existing test IDs
            const existingTestIds = new Set(currentTests.map(test => test.id));

            // Add only new tests
            const newTests = testsData.filter(test => !existingTestIds.has(test.id));

            console.log(`Adding ${newTests.length} new tests to existing ${currentTests.length} tests`);

            return [...currentTests, ...newTests];
          } else {
            // No existing tests, just use the new ones
            return testsData;
          }
        });
      }
    } catch (error) {
      console.error('Error fetching tests with user ID:', error);
    }
  };

  const handleSaveTest = async () => {
    if (!collegeId) {
      toast({
        title: 'Error',
        description: 'College ID not found. Please refresh the page.',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('Saving test with college ID:', collegeId);

      // Get current user ID as a backup
      const userId = auth.currentUser?.uid;

      // Include college_id in the test data
      const testData = {
        ...formData,
        college_id: collegeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId || 'unknown'
      };

      console.log('Test data to save:', testData);

      if (editingTest) {
        await updateDoc(doc(db, 'aptitude_tests', editingTest.id), {
          ...testData,
          updated_at: new Date().toISOString()
        });
        console.log('Test updated successfully');
        toast({ title: 'Test updated', description: 'Aptitude test updated successfully' });
      } else {
        const docRef = await addDoc(collection(db, 'aptitude_tests'), testData);
        console.log('Test created successfully with ID:', docRef.id);
        toast({ title: 'Test created', description: 'Aptitude test created successfully' });
      }

      // Refresh the tests list
      await fetchTests(collegeId);

      // Also try fetching with user ID if different
      if (userId && userId !== collegeId) {
        await fetchTestsWithUserId(userId);
      }

      setIsDialogOpen(false);
      setFormData({ title: '', description: '', questions: [] });
      setEditingTest(null);
    } catch (error) {
      console.error('Error saving test:', error);
      toast({ title: 'Error', description: 'Failed to save test', variant: 'destructive' });
    }
  };

  const handleEditTest = (test: any) => {
    setEditingTest(test);
    setFormData({
      title: test.title || '',
      description: test.description || '',
      questions: test.questions || []
    });
    setIsDialogOpen(true);
  };

  const handleCreateTest = () => {
    setEditingTest(null);
    setFormData({
      title: '',
      description: '',
      questions: []
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Aptitude Tests</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/QuestionManagement')}
          >
            Manage Questions
          </Button>
          <Button
            onClick={handleCreateTest}
          >
            Create Test
          </Button>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No aptitude tests created yet</p>
          <Button className="mt-4" onClick={handleCreateTest}>
            Create Your First Test
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <CardTitle>{test.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{test.description}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Questions: {Array.isArray(test.questions) ? test.questions.length : 0}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditTest(test)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTest(test);
                      setShowQuestionManager(true);
                    }}
                  >
                    Manage Questions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTest ? 'Edit Aptitude Test' : 'Create Aptitude Test'}</DialogTitle>
            <DialogDescription>
              {editingTest ? 'Update the details of this aptitude test' : 'Create a new aptitude test for your college'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Test Title</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter test title"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter test description"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTest}>
              {editingTest ? 'Update Test' : 'Create Test'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Manager Dialog */}
      <Dialog open={showQuestionManager} onOpenChange={setShowQuestionManager}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Test Questions</DialogTitle>
            <DialogDescription>
              Add or remove questions for this aptitude test
            </DialogDescription>
          </DialogHeader>

          {selectedTest && collegeId && (
            <TestQuestionManager
              testId={selectedTest.id}
              collegeId={collegeId}
              onUpdate={() => fetchTests(collegeId)}
            />
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AptitudeTestManagement;
