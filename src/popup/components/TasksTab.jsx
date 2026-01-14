import React from 'react';

const TasksTab = ({ tasks, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">✓</div>
        <p>No tasks extracted yet</p>
        <p className="text-sm mt-1">Click "Extract Now" on an Attio tasks page</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${task.done ? 'text-green-500' : 'text-gray-400'}`}>
                  {task.done ? '✓' : '○'}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-gray-900 ${task.done ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    {task.dueDate && (
                      <div className="text-sm">
                        <span className="text-gray-500">📅 Due:</span>
                        <span className="ml-2 text-gray-700">{task.dueDate}</span>
                      </div>
                    )}
                    
                    {task.assignee && (
                      <div className="text-sm">
                        <span className="text-gray-500">👤 Assigned to:</span>
                        <span className="ml-2 text-gray-700">{task.assignee}</span>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        task.done 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.done ? 'Complete' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onDelete(task.id)}
              className="text-red-500 hover:text-red-700 ml-4"
              title="Delete task"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TasksTab;