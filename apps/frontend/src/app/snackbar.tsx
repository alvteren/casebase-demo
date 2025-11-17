import { useEffect } from 'react';

interface SnackbarProps {
  message: string;
  open: boolean;
  onClose: () => void;
  duration?: number;
}

export function Snackbar({ message, open, onClose, duration = 3000 }: SnackbarProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md">
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

