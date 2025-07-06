import React from 'react';

interface ErrorFallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-800 p-4"
    >
      <h2 className="text-2xl font-bold mb-4">Bir şeyler ters gitti...</h2>
      <pre className="text-sm bg-red-100 p-4 rounded-md whitespace-pre-wrap max-w-2xl overflow-auto">
        {errorMessage}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Tekrar Dene
      </button>
      <p className="mt-4 text-xs text-red-600">
        Bu hatayı görmeye devam ederseniz, lütfen geliştirici ile iletişime geçin.
      </p>
    </div>
  );
};

export default ErrorFallback; 