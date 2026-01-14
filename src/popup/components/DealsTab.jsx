import React from 'react';

const DealsTab = ({ deals, onDelete }) => {
  if (deals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2"></div>
        <p>No deals extracted yet</p>
        <p className="text-sm mt-1">Click "Extract Now" on an Attio deals page</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deals.map(deal => (
        <div key={deal.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{deal.name}</h3>
              
              <div className="mt-2 space-y-1">
                {deal.value && (
                  <div className="text-sm">
                    <span className="text-gray-500"> Value:</span>
                    <span className="ml-2 font-medium text-green-600">{deal.value}</span>
                  </div>
                )}
                
                {deal.stage && (
                  <div className="text-sm">
                    <span className="text-gray-500"> Stage:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {deal.stage}
                    </span>
                  </div>
                )}
                
                {deal.company && (
                  <div className="text-sm">
                    <span className="text-gray-500"> Company:</span>
                    <span className="ml-2 text-gray-700">{deal.company}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onDelete(deal.id)}
              className="text-red-500 hover:text-red-700 ml-4"
              title="Delete deal"
            >
              
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DealsTab;