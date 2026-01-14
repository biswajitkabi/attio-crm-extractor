// ExportButton.jsx - No external dependencies
// File: src/popup/components/ExportButton.jsx

import React, { useState } from 'react';

const ExportButton = ({ data }) => {
  const [showMenu, setShowMenu] = useState(false);

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attio-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const exportAsCSV = (type) => {
    let csv = '';
    let filename = '';

    if (type === 'contacts') {
      csv = 'Name,Emails,Phones\n';
      data.contacts.forEach(c => {
        csv += `"${c.name}","${c.emails.join('; ')}","${c.phones.join('; ')}"\n`;
      });
      filename = `attio-contacts-${Date.now()}.csv`;
    } else if (type === 'deals') {
      csv = 'Name,Value,Stage,Company\n';
      data.deals.forEach(d => {
        csv += `"${d.name}","${d.value || ''}","${d.stage}","${d.company}"\n`;
      });
      filename = `attio-deals-${Date.now()}.csv`;
    } else if (type === 'tasks') {
      csv = 'Title,Due Date,Assignee,Status\n';
      data.tasks.forEach(t => {
        csv += `"${t.title}","${t.dueDate || ''}","${t.assignee}","${t.done ? 'Complete' : 'In Progress'}"\n`;
      });
      filename = `attio-tasks-${Date.now()}.csv`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={styles.button}
      >
        📤 Export
      </button>
      
      {showMenu && (
        <>
          <div 
            style={styles.overlay}
            onClick={() => setShowMenu(false)}
          />
          <div style={styles.menu}>
            <button
              onClick={exportAsJSON}
              style={styles.menuItem}
            >
              📄 Export All (JSON)
            </button>
            <button
              onClick={() => exportAsCSV('contacts')}
              style={styles.menuItem}
            >
              📊 Export Contacts (CSV)
            </button>
            <button
              onClick={() => exportAsCSV('deals')}
              style={styles.menuItem}
            >
              💼 Export Deals (CSV)
            </button>
            <button
              onClick={() => exportAsCSV('tasks')}
              style={styles.menuItem}
            >
              ✓ Export Tasks (CSV)
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative'
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    fontSize: '14px'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10
  },
  menu: {
    position: 'absolute',
    right: 0,
    marginTop: '0.5rem',
    width: '200px',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    zIndex: 20,
    overflow: 'hidden'
  },
  menuItem: {
    width: '100%',
    textAlign: 'left',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'white',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  }
};

export default ExportButton;