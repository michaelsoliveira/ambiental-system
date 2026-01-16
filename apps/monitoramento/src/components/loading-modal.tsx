import React from "react";

const LoadingModal = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-700">Carregando...</p>
      </div>
    </div>
  );
};

export default LoadingModal;