import { useState, useRef, ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@casebase-demo/utils';

export interface FileDropZoneProps {
  children: ReactNode;
  onFileDrop: (file: File) => void | Promise<void>;
  accept?: string[];
  maxSize?: number; // in bytes
  disabled?: boolean;
  validateFile?: (file: File) => boolean | string; // returns true if valid, error message if invalid
  className?: string;
  overlayText?: string;
  overlaySubtext?: string;
}

export function FileDropZone({
  children,
  onFileDrop,
  accept = ['.pdf', '.docx', '.doc', '.txt'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  validateFile,
  className,
  overlayText = 'Drop file here to upload',
  overlaySubtext,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
  };

  const defaultValidateFile = (file: File): boolean | string => {
    // Check file type
    const fileName = file.name.toLowerCase();
    const isValidType = accept.some(type => fileName.endsWith(type.toLowerCase()));
    
    if (!isValidType) {
      return `Invalid file type. Please upload ${accept.join(', ')} files only.`;
    }
    
    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }
    
    return true;
  };

  const validate = (file: File): boolean | string => {
    if (validateFile) {
      return validateFile(file);
    }
    return defaultValidateFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const validationResult = validate(file);
      
      if (validationResult === true) {
        await onFileDrop(file);
      }
      // If validation returns an error message, the parent component should handle it
      // We just don't call onFileDrop if validation fails
    }
  };

  return (
    <div
      className={cn(
        "relative",
        "border-2 border-dashed rounded-lg transition-colors",
        isDragging && !disabled
          ? "border-primary bg-primary/5"
          : "border-transparent",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop Zone Overlay */}
      {isDragging && !disabled && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-2 text-primary" />
            <p className="text-lg font-semibold text-primary">{overlayText}</p>
            {overlaySubtext && (
              <p className="text-sm text-muted-foreground mt-1">{overlaySubtext}</p>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

