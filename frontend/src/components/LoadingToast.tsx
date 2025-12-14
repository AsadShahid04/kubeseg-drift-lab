import { useEffect, useState } from "react";

interface LoadingToastProps {
  show: boolean;
  onClose: () => void;
}

export default function LoadingToast({ show, onClose }: LoadingToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      // Fade out animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-md border-l-4 border-blue-400">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">
              Backend Service Starting Up
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              We're using the free tier of our hosting provider, which spins
              down backend services after 15 minutes of inactivity. If loading
              takes longer than expected, please refresh the page and try again
              in a minute or two.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-blue-200 hover:text-white transition"
            aria-label="Close"
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
    </div>
  );
}
