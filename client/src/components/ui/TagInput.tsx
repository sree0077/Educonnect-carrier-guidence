import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxTags?: number;
  suggestions?: string[];
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  label,
  placeholder = 'Add a tag...',
  error,
  required = false,
  maxTags = 10,
  suggestions = []
}) => {
  const [localTags, setLocalTags] = useState<string[]>(tags || []);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setLocalTags(tags || []);
  }, [tags]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && localTags.length > 0) {
      removeTag(localTags.length - 1);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !localTags.includes(trimmedTag) && localTags.length < maxTags) {
      const newTags = [...localTags, trimmedTag];
      setLocalTags(newTags);
      onChange(newTags);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = localTags.filter((_, i) => i !== index);
    setLocalTags(newTags);
    onChange(newTags);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className={`flex flex-wrap gap-2 p-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}>
        {localTags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 text-purple-600 hover:text-purple-800"
              aria-label={`Remove ${tag}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue.trim() && addTag(inputValue)}
          placeholder={localTags.length === 0 ? placeholder : ''}
          className="flex-grow min-w-[120px] border-none shadow-none focus-visible:ring-0 p-0 h-8"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {localTags.length >= maxTags && (
        <p className="text-sm text-amber-600">Maximum number of tags reached ({maxTags})</p>
      )}
      <p className="text-xs text-gray-500">Press Enter to add a tag, Backspace to remove the last tag</p>
    </div>
  );
};

export default TagInput;
