import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestions, deleteQuestion, getCurrentCollegeId } from '@/utils/firebase-helpers';
import { Question } from '@/types/question';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/button';
import BulkUploadModal from '@/components/college/BulkUploadModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  Eye,
  Loader2,
  School,
  Upload,
  FileJson
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const QuestionsList = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [collegeId, setCollegeId] = useState<string>('');
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get the current college ID
    const currentCollegeId = getCurrentCollegeId();
    setCollegeId(currentCollegeId);

    // Fetch questions for this college
    fetchQuestions(currentCollegeId);
  }, []);

  const fetchQuestions = async (collegeId: string) => {
    try {
      setLoading(true);
      const fetchedQuestions = await getQuestions(collegeId);
      setQuestions(fetchedQuestions as Question[]);
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

  const handleEdit = (questionId: string) => {
    navigate(`/QuestionManagement/${questionId}`);
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    try {
      // Delete the question from the college's subcollection
      await deleteQuestion(questionToDelete, collegeId);
      setQuestions(questions.filter(q => q.id !== questionToDelete));
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const confirmDelete = (questionId: string) => {
    setQuestionToDelete(questionId);
    setDeleteDialogOpen(true);
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    const plainText = stripHtml(text);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Questions List</h1>
          <div className="flex items-center text-gray-500 mt-1">
            <School className="h-4 w-4 mr-1" />
            <p>College ID: {collegeId}</p>
          </div>
          <p className="text-gray-500">Manage your aptitude test questions</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/QuestionManagement')}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Form
          </Button>
          <Button
            variant="outline"
            onClick={() => setBulkUploadOpen(true)}
            leftIcon={<Upload size={16} />}
          >
            Bulk Upload
          </Button>
          <Button
            onClick={() => navigate('/QuestionManagement')}
            leftIcon={<Plus size={16} />}
          >
            Create New Question
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Questions</CardTitle>
          <CardDescription>
            {questions.length} questions found for this college
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions found for this college. Create your first question!</p>
              <Button
                className="mt-4"
                onClick={() => navigate('/QuestionManagement')}
              >
                Create Question
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question, index) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{truncateText(question.text)}</TableCell>
                    <TableCell>{question.type}</TableCell>
                    <TableCell>{question.difficultyLevel}</TableCell>
                    <TableCell>{question.categories?.join(', ') || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(question.id)}
                        >
                          <Pencil size={16} />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(question.id)}
                        >
                          <Trash2 size={16} />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={() => {
          // Refresh the questions list after successful upload
          fetchQuestions(collegeId);
          toast({
            title: 'Success',
            description: 'Questions uploaded successfully',
          });
        }}
        collegeId={collegeId}
      />
    </div>
  );
};

export default QuestionsList;
