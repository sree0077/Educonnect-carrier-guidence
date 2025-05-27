import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, FileJson } from 'lucide-react';
import { bulkUploadQuestions, parseQuestionsJson } from '@/utils/firebase-helpers';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/ui/button';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  collegeId?: string;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  collegeId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        setError('Please select a JSON file');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);

      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          setJsonContent(content);
          // Try parsing to validate JSON
          parseQuestionsJson(content);
        } catch (err) {
          setError(`Invalid JSON format: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setJsonContent(content);

    // Clear error when user starts typing
    if (error) setError(null);

    // Only try to parse if there's content
    if (content.trim()) {
      try {
        parseQuestionsJson(content);
      } catch (err) {
        // Don't set error while user is typing
      }
    }
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      setError(null);

      if (!jsonContent.trim()) {
        setError('Please provide JSON content');
        return;
      }

      // Parse the JSON content
      const questions = parseQuestionsJson(jsonContent);

      if (questions.length === 0) {
        setError('No valid questions found in the JSON');
        return;
      }

      // Upload the questions
      const result = await bulkUploadQuestions(questions, collegeId);
      setUploadResult(result);

      // Show toast notification
      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${result.successful} of ${result.total} questions`,
      });

      // If all questions were uploaded successfully, close the modal after a delay
      if (result.successful === result.total) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/json' && !droppedFile.name.endsWith('.json')) {
        setError('Please drop a JSON file');
        return;
      }

      // Manually set the file in the input element
      if (fileInputRef.current) {
        // Create a DataTransfer object to set the files property
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInputRef.current.files = dataTransfer.files;

        // Trigger the change event handler
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Bulk Upload Questions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <FileJson className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 mb-2">Drag and drop a JSON file or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              leftIcon={<Upload size={16} />}
            >
              Select JSON File
            </Button>
            {file && (
              <p className="mt-2 text-sm text-green-600">
                Selected file: {file.name}
              </p>
            )}
          </div>

          {/* JSON Editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JSON Content
            </label>
            <textarea
              className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-sm"
              value={jsonContent}
              onChange={handleTextAreaChange}
              placeholder='[{"text": "Question text", "type": "mcq-single", "options": [...]}]'
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="font-medium text-green-800">Upload Results</h3>
              </div>
              <ul className="text-sm text-green-700 ml-7 list-disc">
                <li>Total questions: {uploadResult.total}</li>
                <li>Successfully uploaded: {uploadResult.successful}</li>
                {uploadResult.failed > 0 && (
                  <li className="text-amber-700">Failed: {uploadResult.failed}</li>
                )}
              </ul>
              {uploadResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  <p className="font-medium">Errors:</p>
                  <ul className="ml-5 list-disc">
                    {uploadResult.errors.slice(0, 3).map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                    {uploadResult.errors.length > 3 && (
                      <li>...and {uploadResult.errors.length - 3} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Sample JSON Format */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium text-blue-800">Sample JSON Format</h3>
              <a
                href="/sample-questions.json"
                download
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <FileJson className="h-4 w-4 mr-1" />
                Download Sample
              </a>
            </div>
            <pre className="text-xs text-blue-700 overflow-x-auto">
{`[
  {
    "text": "<p>Question text here?</p>",
    "type": "mcq-single",
    "difficultyLevel": "medium",
    "categories": ["Math", "Algebra"],
    "options": [
      {
        "id": "option-1",
        "text": "Option 1",
        "isCorrect": true,
        "explanation": "Optional explanation"
      },
      {
        "id": "option-2",
        "text": "Option 2",
        "isCorrect": false,
        "explanation": ""
      }
    ]
  }
]`}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            isLoading={isUploading}
            leftIcon={<Upload size={16} />}
          >
            Upload Questions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
