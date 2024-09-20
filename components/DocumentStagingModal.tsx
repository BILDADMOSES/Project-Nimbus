"use client";

import { useState } from 'react';
import { DocumentIcon, LanguageIcon, XCircleIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface DocumentStagingModalProps {
  file: File;
  onClose: () => void;
  onStage: (originalFile: File, translatedFile: File | null, originalUrl: string, translatedUrl: string | null) => void;
  targetLanguage: string;
  chatId: string;
}

const DocumentStagingModal: React.FC<DocumentStagingModalProps> = ({ 
  file, 
  onClose, 
  onStage, 
  targetLanguage, 
  chatId 
}) => {
  const [shouldTranslate, setShouldTranslate] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFileValid, setIsFileValid] = useState(true);

  const validateFile = async () => {
    setIsValidating(true);
    setError(null);
    
    if (file.type === 'application/pdf') {
      try {
        console.log('Sending PDF for validation:', file.name);
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        setIsFileValid(data.pageCount <= 2);
        if (data.pageCount > 2) {
          setError('PDF exceeds the maximum of 2 pages. It will be sent without translation.');
        }
      } catch (error) {
        console.error('Error parsing PDF:', error);
        setError('Error validating PDF file. Please try again.');
        setIsFileValid(false);
      }
    } else if (file.type.startsWith('text/')) {
      const content = await file.text();
      setIsFileValid(content.length <= 1200);
      if (content.length > 1200) {
        setError('Text exceeds the maximum of 1200 characters. It will be sent without translation.');
      }
    } else {
      setIsFileValid(false);
      setError('Only text or PDF files can be translated.');
    }
    
    setIsValidating(false);
  };

  const handleTranslateToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newShouldTranslate = e.target.checked;
    setShouldTranslate(newShouldTranslate);
    if (newShouldTranslate) {
      await validateFile();
    } else {
      setIsFileValid(true);
      setError(null);
    }
  };

  const handleStage = async () => {
    if (shouldTranslate && !isFileValid) {
      setError('File is too large or not supported for translation.');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      if (shouldTranslate) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetLanguage', targetLanguage);
        formData.append('chatId', chatId);

        const response = await fetch('/api/translate-document', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Translation response:', data);

        const { originalFileUrl, translatedFileUrl, originalFileName, translatedFileName } = data;

        onStage(file, null, originalFileUrl, translatedFileUrl);
      } else {
        onStage(file, null, '', null);
      }
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Failed to process document. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleStage();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <DocumentIcon className="h-6 w-6 mr-2" />
          Document Staging
        </h3>
        <p className="mb-4 flex items-center">
          <DocumentIcon className="h-5 w-5 mr-2" />
          {file.name}
        </p>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text flex items-center">
              <LanguageIcon className="h-5 w-5 mr-2" />
              Translate document to recipient's language
            </span>
            <input
              type="checkbox"
              checked={shouldTranslate}
              onChange={handleTranslateToggle}
              className="checkbox"
              disabled={isValidating || isTranslating}
            />
          </label>
        </div>
        {isValidating && (
          <p className="text-info mt-2">Validating file...</p>
        )}
        {shouldTranslate && !isFileValid && (
          <p className="text-warning mt-2">
            This file is too large or not supported for translation. It will be sent without translation.
          </p>
        )}
        {error && (
          <div className="alert alert-error mt-4">
            <XCircleIcon className="h-5 w-5 mr-2" />
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost ml-auto" onClick={handleRetry}>
              <ArrowPathIcon className="h-5 w-5" />
              Retry
            </button>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button className="btn btn-ghost mr-2" onClick={onClose} disabled={isTranslating || isValidating}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleStage} 
            disabled={isTranslating || isValidating || (shouldTranslate && !isFileValid)}
          >
            {isTranslating ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Processing...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentStagingModal;