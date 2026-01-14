import React from 'react';

const ContactsTab = ({ contacts, onDelete }) => {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">👥</div>
        <p>No contacts extracted yet</p>
        <p className="text-sm mt-1">Click "Extract Now" on an Attio contacts page</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map(contact => (
        <div key={contact.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{contact.name || 'Unknown'}</h3>
              
              {contact.emails && contact.emails.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">📧 Email</div>
                  {contact.emails.map((email, idx) => (
                    <div key={idx} className="text-sm text-blue-600">{email}</div>
                  ))}
                </div>
              )}
              
              {contact.phones && contact.phones.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">📱 Phone</div>
                  {contact.phones.map((phone, idx) => (
                    <div key={idx} className="text-sm text-gray-700">{phone}</div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => onDelete(contact.id)}
              className="text-red-500 hover:text-red-700 ml-4"
              title="Delete contact"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactsTab;