import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ChevronDown, ChevronUp, Save, Eye } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionType, DifficultyLevel, Option, questionTypeLabels, difficultyLevelLabels } from '@/types/question';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import RichTextEditor from '@/components/ui/RichTextEditor';
import OptionInput from '@/components/ui/OptionInput';
import TagInput from '@/components/ui/TagInput';

const QuestionForm = ({
  initialData,
  onSubmit,
  onPreview,
  isSubmitting = false,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    options: true,
    additional: true,
  });

  const defaultValues = {
    type: 'mcq-single',
    text: '',
    options: [],
    difficultyLevel: 'medium',
    categories: [],
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: initialData || defaultValues,
  });

  const questionType = watch('type');
  const questionText = watch('text');
  const options = watch('options');
  const difficultyLevel = watch('difficultyLevel');
  const categories = watch('categories');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePreview = () => {
    const previewData = {
      id: initialData?.id || uuidv4(),
      type: questionType,
      text: questionText,
      options: options,
      difficultyLevel: difficultyLevel,
      categories: categories,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    onPreview(previewData);
  };

  const submitForm = (data) => {
    onSubmit(data);
  };

  const typeOptions = Object.entries(questionTypeLabels).map(([value, label]) => ({
    value,
    label: label as string,
  }));

  const difficultyOptions = Object.entries(difficultyLevelLabels).map(([value, label]) => ({
    value,
    label: label as string,
  }));

  const isMCQType = questionType === 'mcq-single' || questionType === 'mcq-multiple';
  const isMultipleCorrect = questionType === 'mcq-multiple';

  const categorySuggestions = [
    'Algebra', 'Geometry', 'Calculus', 'Statistics', 'Probability',
    'Vocabulary', 'Grammar', 'Reading Comprehension', 'Syntax',
    'Current Affairs', 'History', 'Geography', 'Science', 'Technology',
    'Logical Reasoning', 'Analytical Reasoning', 'Critical Thinking',
  ];

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
      <Card>
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => toggleSection('basic')}
        >
          <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          <button type="button" className="text-gray-500">
            {expandedSections.basic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expandedSections.basic && (
          <CardContent className="space-y-4">
            <Controller
              name="type"
              control={control}
              rules={{ required: 'Question type is required' }}
              render={({ field, fieldState }) => (
                <Select
                  options={Object.entries(questionTypeLabels).map(([value, label]) => ({ value, label: label as string }))}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />

            <Controller
              name="text"
              control={control}
              rules={{ required: 'Question text is required' }}
              render={({ field, fieldState }) => (
                <RichTextEditor
                  label="Question Text"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Enter your question here..."
                />
              )}
            />
          </CardContent>
        )}
      </Card>

      {isMCQType && (
        <Card>
          <div
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => toggleSection('options')}
          >
            <h2 className="text-lg font-medium text-gray-900">Answer Options</h2>
            <button type="button" className="text-gray-500">
              {expandedSections.options ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {expandedSections.options && (
            <CardContent>
              <Controller
                name="options"
                control={control}
                rules={{
                  validate: {
                    minOptions: (value) => (value.length >= 2 || 'At least 2 options are required'),
                    hasCorrect: (value) => (value.some(o => o.isCorrect) || 'At least one option must be marked as correct'),
                    notEmpty: (value) => (value.every(o => o.text.trim() !== '') || 'Option text cannot be empty'),
                  }
                }}
                render={({ field, fieldState }) => (
                  <OptionInput
                    options={field.value}
                    onChange={field.onChange}
                    isMultipleCorrect={isMultipleCorrect}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <div
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => toggleSection('additional')}
        >
          <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
          <button type="button" className="text-gray-500">
            {expandedSections.additional ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expandedSections.additional && (
          <CardContent className="space-y-4">
            <Controller
              name="difficultyLevel"
              control={control}
              rules={{ required: 'Difficulty level is required' }}
              render={({ field, fieldState }) => (
                <Select
                  options={Object.entries(difficultyLevelLabels).map(([value, label]) => ({ value, label: label as string }))}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  required
                />
              )}
            />

            <Controller
              name="categories"
              control={control}
              render={({ field, fieldState }) => (
                <TagInput
                  label="Categories/Topics"
                  tags={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Add relevant topics..."
                  suggestions={categorySuggestions}
                />
              )}
            />
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          leftIcon={<Eye size={16} /> as React.ReactNode}
          onClick={handlePreview}
        >
          Preview
        </Button>
        <Button
          type="submit"
          leftIcon={<Save size={16} /> as React.ReactNode}
          isLoading={isSubmitting}
        >
          Save Question
        </Button>
      </div>
    </form>
  );
};

export default QuestionForm;
