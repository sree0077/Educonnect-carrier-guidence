import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from '@/components/college/QuestionForm';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { saveQuestion, getQuestions, updateQuestion, getCurrentCollegeId } from '@/utils/firebase-helpers';
import { Question } from '@/types/question';
import { School } from 'lucide-react';

const QuestionManagement = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [collegeId, setCollegeId] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Get the current college ID on component mount
  useEffect(() => {
    const currentCollegeId = getCurrentCollegeId();
    setCollegeId(currentCollegeId);
  }, []);

  // Fetch question data if editing an existing question
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!id || !collegeId) return;

      setLoading(true);
      try {
        // Get questions for this college
        const questions = await getQuestions(collegeId);
        // Find the question by the ID from the URL
        const question = questions.find(q => q.id === id);

        if (question) {
          // Store the question with its Firestore document ID
          setInitialData(question as Question);
        } else {
          toast({
            title: 'Error',
            description: 'Question not found in this college',
            variant: 'destructive'
          });
          navigate('/QuestionsList');
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        toast({
          title: 'Error',
          description: 'Failed to load question data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (collegeId) {
      fetchQuestionData();
    }
  }, [id, collegeId, navigate, toast]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Ensure the data has an ID and timestamps
      const questionData = {
        ...data,
        // For new questions, generate a UUID
        // For existing questions, keep the internal ID from the form data
        id: data.id || uuidv4(),
        createdAt: id ? (data.createdAt || Date.now()) : Date.now(), // Keep original createdAt when editing
        updatedAt: Date.now() // Always update the timestamp
      };

      console.log('Submitting question data:', questionData);

      // First try to save to Firebase
      try {
        if (id && initialData) {
          // When editing, we need to use the Firestore document ID (which is the id from the URL)
          // but keep the internal question ID in the data

          // Create a copy of the data without the id field (Firestore doesn't need it)
          const { id: internalId, ...dataToUpdate } = questionData;

          // Update the question in the college's subcollection
          await updateQuestion(id, dataToUpdate, collegeId);
          console.log(`Question updated in college ${collegeId} with ID:`, id);
        } else {
          // Save new question to the college's subcollection
          const docRef = await saveQuestion(questionData as Question, collegeId);
          console.log(`Question saved to college ${collegeId} with ID:`, docRef.id);
        }

        // Also try the API endpoint for local storage
        try {
          // Try the proxied endpoint first (configured in vite.config.ts)
          const response = await axios.post('/api/questions', {
            ...questionData,
            collegeId // Include the college ID in the API request
          });
          console.log('Data also saved to local API:', response.data);
        } catch (apiError) {
          console.error('API endpoint error (non-critical):', apiError);
          // We don't need to handle this error since Firebase save was successful
        }

        toast({
          title: 'Success',
          description: id ? 'Question updated successfully' : 'Question saved successfully',
        });

        // Navigate to the questions list
        navigate('/QuestionsList');
      } catch (firebaseError) {
        console.error('Firebase save error:', firebaseError);

        // Try API as fallback
        try {
          const directResponse = await axios.post('http://localhost:5000/api/questions', {
            ...questionData,
            collegeId // Include the college ID in the API request
          });
          console.log('Data saved to API as fallback:', directResponse.data);
          toast({
            title: 'Success',
            description: 'Question saved to local API (Firebase failed)',
          });
          navigate('/QuestionsList');
        } catch (directError) {
          console.error('All save methods failed:', directError);

          toast({
            title: 'Error',
            description: 'Failed to save question to any storage',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save question',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = (data: any) => {
    console.log('Preview Data:', data);
    // Save the data to localStorage for preview
    localStorage.setItem('previewQuestion', JSON.stringify({
      ...data,
      collegeId // Include the college ID in the preview data
    }));
    // Navigate to the questions list
    navigate('/QuestionsList');
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Edit Question' : 'Create Question'}</h1>
          <div className="flex items-center text-gray-500 mt-1">
            <School className="h-4 w-4 mr-1" />
            <p>College ID: {collegeId}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/QuestionsList')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          View All Questions
        </button>
      </div>
      <QuestionForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onPreview={handlePreview}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default QuestionManagement;
