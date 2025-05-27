import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Check } from 'lucide-react';
import Button from '@/components/ui/button';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface OptionInputProps {
  options: Option[];
  onChange: (options: Option[]) => void;
  label?: string;
  error?: string;
  required?: boolean;
  isMultipleCorrect?: boolean;
}

const OptionInput: React.FC<OptionInputProps> = ({
  options,
  onChange,
  label = 'Options',
  error,
  required = false,
  isMultipleCorrect = false
}) => {
  const [localOptions, setLocalOptions] = useState<Option[]>(options || []);

  useEffect(() => {
    setLocalOptions(options || []);
  }, [options]);

  const handleAddOption = () => {
    const newOption: Option = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false
    };
    const updatedOptions = [...localOptions, newOption];
    setLocalOptions(updatedOptions);
    onChange(updatedOptions);
  };

  const handleRemoveOption = (id: string) => {
    const updatedOptions = localOptions.filter(option => option.id !== id);
    setLocalOptions(updatedOptions);
    onChange(updatedOptions);
  };

  const handleOptionChange = (id: string, text: string) => {
    const updatedOptions = localOptions.map(option =>
      option.id === id ? { ...option, text } : option
    );
    setLocalOptions(updatedOptions);
    onChange(updatedOptions);
  };

  const handleCorrectChange = (id: string) => {
    let updatedOptions;

    if (isMultipleCorrect) {
      // For multiple correct answers, toggle the current option
      updatedOptions = localOptions.map(option =>
        option.id === id
          ? { ...option, isCorrect: !option.isCorrect }
          : option
      );
    } else {
      // For single correct answer, make only this one correct
      updatedOptions = localOptions.map(option =>
        option.id === id
          ? { ...option, isCorrect: true }
          : { ...option, isCorrect: false }
      );
    }

    setLocalOptions(updatedOptions);
    onChange(updatedOptions);
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="space-y-2">
        {localOptions.map((option, index) => (
          <div key={option.id} className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleCorrectChange(option.id)}
              className={`flex-shrink-0 w-6 h-6 rounded-full border ${
                option.isCorrect
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300'
              } flex items-center justify-center`}
              aria-label={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
            >
              {option.isCorrect && <Check size={14} />}
            </button>

            <div className="flex-grow">
              <Input
                value={option.text}
                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className={error ? 'border-red-500' : ''}
              />
            </div>

            <button
              type="button"
              onClick={() => handleRemoveOption(option.id)}
              className="flex-shrink-0 text-red-500 hover:text-red-700"
              aria-label="Remove option"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={handleAddOption}
        variant="outline"
        className="mt-2 w-full flex items-center justify-center"
      >
        <Plus size={16} className="mr-1" />
        Add Option
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default OptionInput;
