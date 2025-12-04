import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, X } from 'lucide-react';

export const ErrorToast = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-20 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl z-[9999] animate-slide-in-right max-w-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Location Unavailable</p>
          <p className="text-sm opacity-90 mt-1">{message}</p>
        </div>
        <button 
          onClick={onClose} 
          className="ml-2 hover:bg-red-600 rounded p-1 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

ErrorToast.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
};
