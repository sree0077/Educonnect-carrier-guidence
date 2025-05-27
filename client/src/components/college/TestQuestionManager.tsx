import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import './TestQuestionManager.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Plus, Trash, BookOpen } from 'lucide-react';
import { getQuestions, addQuestionsToTest, removeQuestionsFromTest } from '@/utils/firebase-helpers';
import { Question } from '@/types/question';
import { db } from '@config/firebase.config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface TestQuestionManagerProps {
  testId: string;
  collegeId: string;
  onUpdate?: () => void;
}

const TestQuestionManager: React.FC<TestQuestionManagerProps> = ({
  testId,
  collegeId,
  onUpdate
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testQuestions, setTestQuestions] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all questions for this college
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching questions for college ID:', collegeId);

        // Directly query the questions subcollection for this college
        const questionsCollectionRef = collection(db, 'colleges', collegeId, 'questions');
        const questionsSnapshot = await getDocs(questionsCollectionRef);

        const allQuestions = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];

        console.log(`Found ${allQuestions.length} questions for college ${collegeId}`);
        setQuestions(allQuestions);

        // Get the test document to see which questions are already included
        const testDocRef = doc(db, 'aptitude_tests', testId);
        const testDocSnap = await getDoc(testDocRef);

        if (testDocSnap.exists()) {
          const testData = testDocSnap.data();
          console.log('Test data:', testData);

          if (testData && Array.isArray(testData.questions)) {
            setTestQuestions(testData.questions);
            console.log(`Test has ${testData.questions.length} questions assigned`);
          } else {
            console.log('No questions array found in test document');
            setTestQuestions([]);
          }
        } else {
          console.log('Test document not found');
          setTestQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load questions',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    // If collegeId is not provided, try to get it from localStorage
    let effectiveCollegeId = collegeId;

    if (!effectiveCollegeId) {
      const storedCollegeId = localStorage.getItem('currentCollegeId');
      if (storedCollegeId) {
        console.log('Using college ID from localStorage:', storedCollegeId);
        effectiveCollegeId = storedCollegeId;
      } else {
        console.error('No college ID available');
      }
    }

    if (effectiveCollegeId && testId) {
      // Use a different variable name to avoid confusion with the prop
      const finalCollegeId = effectiveCollegeId;

      // Modify the fetchData function to use the effective college ID
      const fetchDataWithEffectiveId = async () => {
        setLoading(true);
        try {
          console.log('Fetching questions for college ID:', finalCollegeId);

          // Directly query the questions subcollection for this college
          const questionsCollectionRef = collection(db, 'colleges', finalCollegeId, 'questions');
          const questionsSnapshot = await getDocs(questionsCollectionRef);

          const allQuestions = questionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Question[];

          console.log(`Found ${allQuestions.length} questions for college ${finalCollegeId}`);
          setQuestions(allQuestions);

          // Get the test document to see which questions are already included
          const testDocRef = doc(db, 'aptitude_tests', testId);
          const testDocSnap = await getDoc(testDocRef);

          if (testDocSnap.exists()) {
            const testData = testDocSnap.data();
            console.log('Test data:', testData);

            if (testData && Array.isArray(testData.questions)) {
              setTestQuestions(testData.questions);
              console.log(`Test has ${testData.questions.length} questions assigned`);
            } else {
              console.log('No questions array found in test document');
              setTestQuestions([]);
            }
          } else {
            console.log('Test document not found');
            setTestQuestions([]);
          }
        } catch (error) {
          console.error('Error fetching questions:', error);
          toast({
            title: 'Error',
            description: 'Failed to load questions',
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      };

      fetchDataWithEffectiveId();
    } else {
      console.error('Missing collegeId or testId', { collegeId, effectiveCollegeId, testId });
      toast({
        title: 'Error',
        description: 'Missing college or test information',
        variant: 'destructive'
      });
    }
  }, [collegeId, testId, toast]);

  // Helper function to get the effective college ID
  const getEffectiveCollegeId = () => {
    if (collegeId) return collegeId;

    const storedCollegeId = localStorage.getItem('currentCollegeId');
    if (storedCollegeId) {
      console.log('Using college ID from localStorage:', storedCollegeId);
      return storedCollegeId;
    }

    console.error('No college ID available');
    return null;
  };

  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: 'No questions selected',
        description: 'Please select at least one question to add',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await addQuestionsToTest(testId, selectedQuestions);

      // Update the local state
      setTestQuestions(prev => [...new Set([...prev, ...selectedQuestions])]);

      toast({
        title: 'Questions added',
        description: `Added ${selectedQuestions.length} questions to the test`
      });

      // Clear selection
      setSelectedQuestions([]);

      // Close dialog
      setIsDialogOpen(false);

      // Call the onUpdate callback if provided
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding questions to test:', error);
      toast({
        title: 'Error',
        description: 'Failed to add questions to test',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    setLoading(true);
    try {
      await removeQuestionsFromTest(testId, [questionId]);

      // Update the local state
      setTestQuestions(prev => prev.filter(id => id !== questionId));

      toast({
        title: 'Question removed',
        description: 'Question removed from test'
      });

      // Call the onUpdate callback if provided
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error removing question from test:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove question from test',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all filtered questions that aren't already in the test
      const filteredQuestionIds = filteredQuestions
        .filter(q => !testQuestions.includes(q.id))
        .map(q => q.id);
      setSelectedQuestions(filteredQuestionIds);
    } else {
      setSelectedQuestions([]);
    }
  };

  // Filter questions based on search term
  const filteredQuestions = questions.filter(question => {
    const searchLower = searchTerm.toLowerCase();
    return (
      question.text.toLowerCase().includes(searchLower) ||
      (question.categories && question.categories.some(cat => cat.toLowerCase().includes(searchLower))) ||
      (question.difficultyLevel && question.difficultyLevel.toLowerCase().includes(searchLower))
    );
  });

  // Get questions that are already in the test
  const currentTestQuestions = questions.filter(q => testQuestions.includes(q.id));

  return (
    <div className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto p-4">
      <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
        <h3 className="text-lg font-medium">Test Questions</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const effectiveCollegeId = getEffectiveCollegeId();
              if (effectiveCollegeId) {
                console.log('Manually refreshing questions for college ID:', effectiveCollegeId);

                // Directly query the questions subcollection for this college
                setLoading(true);
                const questionsCollectionRef = collection(db, 'colleges', effectiveCollegeId, 'questions');
                getDocs(questionsCollectionRef)
                  .then(questionsSnapshot => {
                    const allQuestions = questionsSnapshot.docs.map(doc => ({
                      id: doc.id,
                      ...doc.data()
                    })) as Question[];

                    console.log(`Found ${allQuestions.length} questions for college ${effectiveCollegeId}`);
                    setQuestions(allQuestions);
                    toast({
                      title: 'Questions refreshed',
                      description: `Found ${allQuestions.length} questions`
                    });
                  })
                  .catch(error => {
                    console.error('Error refreshing questions:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to refresh questions',
                      variant: 'destructive'
                    });
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }
            }}
            disabled={loading}
          >
            Refresh Questions
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Questions
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-2">Loading questions...</span>
        </div>
      ) : currentTestQuestions.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-gray-500">
            {questions.length === 0
              ? "No questions found for this college. Please create questions first."
              : "No questions added to this test yet"}
          </p>
          {questions.length === 0 ? (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => navigate('/QuestionManagement')}
            >
              Create Questions
            </Button>
          ) : (
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              Add Questions
            </Button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <Table className="test-question-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Question</TableHead>
                <TableHead className="w-[15%]">Type</TableHead>
                <TableHead className="w-[20%]">Categories</TableHead>
                <TableHead className="w-[15%]">Difficulty</TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTestQuestions.map(question => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium max-w-[40%] question-text-cell">
                    <div
                      className="truncate-text"
                      title={question.text.replace(/<[^>]*>/g, '')}
                    >
                      {question.text.replace(/<[^>]*>/g, '')}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[15%]">
                    <div className="truncate-text">
                      {question.type === 'mcq-single' ? 'Multiple Choice' : question.type}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[20%]">
                    <div className="truncate-text" title={question.categories?.join(', ')}>
                      {question.categories?.join(', ')}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[15%]">{question.difficultyLevel}</TableCell>
                  <TableCell className="max-w-[10%] text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(question.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] question-dialog">
          <DialogHeader>
            <DialogTitle>Add Questions to Test</DialogTitle>
            <DialogDescription>
              Select questions from your college to add to this aptitude test
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 question-dialog-content">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                <span className="ml-2">Loading questions...</span>
              </div>
            ) : filteredQuestions.filter(q => !testQuestions.includes(q.id)).length === 0 ? (
              <div className="text-center p-8 border rounded-md bg-gray-50">
                <p className="text-gray-500">
                  {questions.length === 0
                    ? "No questions found for this college. Please create questions first."
                    : "All available questions have already been added to this test."}
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => navigate('/QuestionManagement')}
                >
                  Create Questions
                </Button>
              </div>
            ) : (
              <div className="table-container">
                <Table className="test-question-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[5%]">
                        <Checkbox
                          checked={selectedQuestions.length > 0 && selectedQuestions.length === filteredQuestions.filter(q => !testQuestions.includes(q.id)).length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[40%]">Question</TableHead>
                      <TableHead className="w-[15%]">Type</TableHead>
                      <TableHead className="w-[25%]">Categories</TableHead>
                      <TableHead className="w-[15%]">Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions
                      .filter(q => !testQuestions.includes(q.id))
                      .map(question => (
                        <TableRow key={question.id}>
                          <TableCell className="w-[5%]">
                            <Checkbox
                              checked={selectedQuestions.includes(question.id)}
                              onCheckedChange={(checked) => handleSelectQuestion(question.id, checked === true)}
                            />
                          </TableCell>
                          <TableCell className="font-medium max-w-[40%] question-text-cell">
                            <div
                              className="truncate-text"
                              title={question.text.replace(/<[^>]*>/g, '')}
                            >
                              {question.text.replace(/<[^>]*>/g, '')}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[15%]">
                            <div className="truncate-text">
                              {question.type === 'mcq-single' ? 'Multiple Choice' : question.type}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[25%]">
                            <div className="truncate-text" title={question.categories?.join(', ')}>
                              {question.categories?.join(', ')}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[15%]">{question.difficultyLevel}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAddQuestions}
              disabled={selectedQuestions.length === 0 || loading}
            >
              {loading ? 'Adding...' : `Add ${selectedQuestions.length} Questions`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestQuestionManager;
