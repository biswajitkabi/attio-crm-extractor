// Popup.jsx - No external icon dependencies
// File: src/popup/Popup.jsx

import React, { useState, useEffect } from 'react';
import ContactsTab from './components/ContactsTab';
import DealsTab from './components/DealsTab';
import TasksTab from './components/TasksTab';
import ExportButton from './components/ExportButton';

const Popup = () => {
  const [activeTab, setActiveTab] = useState('contacts');
  const [data, setData] = useState({
    contacts: [],
    deals: [],
    tasks: [],
    lastSync: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
    
    // Listen for storage changes (real-time sync across tabs)
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes.attio_data) {
        setData(changes.attio_data.newValue || {
          contacts: [],
          deals: [],
          tasks: [],
          lastSync: null
        });
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadData = async () => {
    const result = await chrome.storage.local.get('attio_data');
    if (result.attio_data) {
      setData(result.attio_data);
    }
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    setMessage('');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('attio.com')) {
        setMessage('❌ Please navigate to an Attio page first');
        setIsExtracting(false);
        return;
      }

      await chrome.tabs.sendMessage(tab.id, { action: 'extract', includePagination: false });
      setMessage('✓ Extraction started! Check the page for progress.');
      
      // Reload data after a short delay
      setTimeout(loadData, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDelete = async (type, id) => {
    const updatedData = { ...data };
    updatedData[type] = updatedData[type].filter(item => item.id !== id);
    
    await chrome.storage.local.set({ attio_data: updatedData });
    setData(updatedData);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all extracted data?')) {
      const emptyData = {
        contacts: [],
        deals: [],
        tasks: [],
        lastSync: null
      };
      await chrome.storage.local.set({ attio_data: emptyData });
      setData(emptyData);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filterData = (items, type) => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      if (type === 'contacts') {
        return item.name?.toLowerCase().includes(query) ||
               item.emails?.some(e => e.toLowerCase().includes(query)) ||
               item.phones?.some(p => p.includes(query));
      } else if (type === 'deals') {
        return item.name?.toLowerCase().includes(query) ||
               item.company?.toLowerCase().includes(query) ||
               item.stage?.toLowerCase().includes(query);
      } else if (type === 'tasks') {
        return item.title?.toLowerCase().includes(query) ||
               item.assignee?.toLowerCase().includes(query);
      }
      return false;
    });
  };

  const tabs = [
    { id: 'contacts', label: 'Contacts', count: data.contacts.length },
    { id: 'deals', label: 'Deals', count: data.deals.length },
    { id: 'tasks', label: 'Tasks', count: data.tasks.length }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Attio CRM Extractor</h1>
        <div style={styles.buttonGroup}>
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            style={{
              ...styles.extractButton,
              ...(isExtracting ? styles.buttonDisabled : {})
            }}
          >
            {isExtracting ? '⏳ Extracting...' : '📥 Extract Now'}
          </button>
          <ExportButton data={data} />
        </div>
        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="🔍 Search all data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {})
            }}
          >
            {tab.label}
            <span style={styles.badge}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === 'contacts' && (
          <ContactsTab
            contacts={filterData(data.contacts, 'contacts')}
            onDelete={(id) => handleDelete('contacts', id)}
          />
        )}
        {activeTab === 'deals' && (
          <DealsTab
            deals={filterData(data.deals, 'deals')}
            onDelete={(id) => handleDelete('deals', id)}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            tasks={filterData(data.tasks, 'tasks')}
            onDelete={(id) => handleDelete('tasks', id)}
          />
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerText}>Last sync: {formatLastSync(data.lastSync)}</div>
        <button onClick={handleClearAll} style={styles.clearButton}>
          Clear All
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  header: {
    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
    color: 'white',
    padding: '1rem'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem'
  },
  extractButton: {
    flex: 1,
    backgroundColor: 'white',
    color: '#3b82f6',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    fontSize: '14px'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  message: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.25rem'
  },
  searchContainer: {
    padding: '1rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb'
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '14px',
    outline: 'none'
  },
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: 'white'
  },
  tab: {
    flex: 1,
    padding: '0.75rem 1rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '14px',
    transition: 'color 0.2s'
  },
  activeTab: {
    borderBottom: '2px solid #3b82f6',
    color: '#3b82f6'
  },
  badge: {
    marginLeft: '0.5rem',
    padding: '0.125rem 0.5rem',
    fontSize: '0.75rem',
    borderRadius: '9999px',
    backgroundColor: '#e5e7eb'
  },
  content: {
    padding: '1rem',
    overflowY: 'auto',
    maxHeight: '400px'
  },
  footer: {
    padding: '1rem',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    color: '#6b7280',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: {
    fontSize: '0.875rem'
  },
  clearButton: {
    color: '#ef4444',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px'
  }
};

export default Popup;