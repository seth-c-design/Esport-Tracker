import React from 'react';

const PlayerCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-700"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-transparent bg-gray-700 rounded w-1/3 h-7 mb-4"></h3>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-md bg-gray-700/50">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-600 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="h-4 bg-gray-600 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCardSkeleton;
