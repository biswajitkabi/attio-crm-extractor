// COMPLETE REWRITE - Attio CRM Extractor with Better Detection
// File: src/content/contentScript.js

class ExtractionIndicator {
  constructor() {
    this.container = null;
    this.shadow = null;
    this.styleContent = `
      .indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 16px 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        min-width: 250px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .indicator-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .status {
        font-weight: 600;
        font-size: 14px;
        color: #1f2937;
      }

      .message {
        font-size: 13px;
        color: #6b7280;
        margin-top: 4px;
        line-height: 1.5;
      }

      .success {
        color: #10b981;
      }

      .error {
        color: #ef4444;
      }

      .close-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #9ca3af;
        padding: 4px;
        line-height: 1;
      }

      .close-btn:hover {
        color: #4b5563;
      }
    `;
  }

  create() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'attio-extractor-indicator';
    this.shadow = this.container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = this.styleContent;
    this.shadow.appendChild(style);
    
    document.body.appendChild(this.container);
  }

  show(status, message) {
    this.create();

    const indicatorEl = document.createElement('div');
    indicatorEl.className = 'indicator';
    
    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    indicatorEl.innerHTML = `
      <button class="close-btn">×</button>
      <div class="indicator-header">
        ${isLoading ? '<div class="spinner"></div>' : ''}
        ${isSuccess ? '<div style="font-size: 24px;">✓</div>' : ''}
        ${isError ? '<div style="font-size: 24px;">✗</div>' : ''}
        <div class="status ${isSuccess ? 'success' : ''} ${isError ? 'error' : ''}">
          ${status === 'loading' ? 'Extracting Data...' : ''}
          ${status === 'success' ? 'Extraction Complete!' : ''}
          ${status === 'error' ? 'Extraction Failed' : ''}
        </div>
      </div>
      <div class="message">${message}</div>
    `;

    const existingStyle = this.shadow.querySelector('style');
    this.shadow.innerHTML = '';
    if (existingStyle) {
      this.shadow.appendChild(existingStyle);
    } else {
      const newStyle = document.createElement('style');
      newStyle.textContent = this.styleContent;
      this.shadow.appendChild(newStyle);
    }
    this.shadow.appendChild(indicatorEl);

    const closeBtn = indicatorEl.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => this.hide());

    if (!isLoading) {
      setTimeout(() => this.hide(), 8000);
    }
  }

  hide() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      this.shadow = null;
    }
  }
}

// Main content script
(async function() {
  const indicator = new ExtractionIndicator();
  let isExtracting = false;

  console.log('[Attio Extractor] Content script loaded on:', window.location.href);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Attio Extractor] Message received:', request);
    if (request.action === 'extract') {
      handleExtraction();
      sendResponse({ status: 'started' });
    }
    return true;
  });

  async function handleExtraction() {
    if (isExtracting) {
      indicator.show('error', 'Extraction already in progress');
      return;
    }

    isExtracting = true;
    indicator.show('loading', 'Starting extraction...');

    try {
      // Detect view type from URL
      const viewType = detectViewType();
      console.log('[Attio Extractor] View type:', viewType);
      
      if (!viewType) {
        throw new Error('Cannot detect page type. Please make sure you are on a People, Deals, or Tasks page in Attio.');
      }

      // Wait for content to be available
      indicator.show('loading', `Waiting for ${viewType} to load...`);
      const contentReady = await waitForContent(5000);
      
      if (!contentReady) {
        console.warn('[Attio Extractor] Content wait timeout, attempting extraction anyway');
      }

      indicator.show('loading', `Extracting ${viewType}...`);
      
      // Give extra time for rendering
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract data
      let data = [];
      if (viewType === 'contacts') {
        data = extractContacts();
      } else if (viewType === 'deals') {
        data = extractDeals();
      } else if (viewType === 'tasks') {
        data = extractTasks();
      }

      console.log('[Attio Extractor] Extracted:', data.length, 'items');
      console.log('[Attio Extractor] Sample:', data.slice(0, 2));

      if (data.length === 0) {
        throw new Error(`No ${viewType} found. The page may still be loading or the table structure has changed. Please wait a moment and try again.`);
      }

      // Save to storage
      chrome.runtime.sendMessage({
        action: 'saveData',
        dataType: viewType,
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Attio Extractor] Save error:', chrome.runtime.lastError);
        } else {
          console.log('[Attio Extractor] Save response:', response);
        }
      });

      indicator.show('success', `Successfully extracted ${data.length} ${viewType}! Open the extension popup to view.`);
      
    } catch (error) {
      console.error('[Attio Extractor] Error:', error);
      indicator.show('error', error.message);
    } finally {
      isExtracting = false;
    }
  }

  function detectViewType() {
    const pathname = window.location.pathname.toLowerCase();
    console.log('[Attio Extractor] Pathname:', pathname);
    
    // Simple path-based detection
    if (pathname.includes('/people') || pathname.includes('/contacts')) {
      return 'contacts';
    }
    if (pathname.includes('/companies')) {
      return 'contacts';
    }
    if (pathname.includes('/deals')) {
      return 'deals';
    }
    if (pathname.includes('/tasks') || pathname.includes('/todos')) {
      return 'tasks';
    }
    
    return null;
  }

  async function waitForContent(timeout = 5000) {
    console.log('[Attio Extractor] Waiting for page content...');
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Check if ANY content is visible
      const allDivs = document.querySelectorAll('div');
      const hasContent = allDivs.length > 50; // Attio pages have lots of divs
      
      if (hasContent) {
        console.log('[Attio Extractor] Content appears ready');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return false;
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function extractContacts() {
    console.log('[Attio Extractor] Starting contact extraction...');
    const contacts = [];
    
    // Domains to ignore (tracking, system emails, etc.)
    const ignoreDomains = [
      'sentry.io',
      'ingest.sentry.io',
      'analytics',
      'tracking',
      'noreply',
      'no-reply',
      'donotreply',
      'mailer-daemon',
      'postmaster'
    ];
    
    // Strategy: Look for ANY text that contains an email, then extract surrounding context
    const allText = document.body.innerText || document.body.textContent;
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    console.log('[Attio Extractor] Total text lines:', lines.length);
    
    // Find all emails first
    const emailRegex = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
    const processedEmails = new Set();
    
    lines.forEach((line, index) => {
      const emails = line.match(emailRegex);
      if (emails && emails.length > 0) {
        emails.forEach(email => {
          if (processedEmails.has(email)) return;
          
          // Skip tracking/system emails
          const emailLower = email.toLowerCase();
          const shouldIgnore = ignoreDomains.some(domain => emailLower.includes(domain));
          if (shouldIgnore) {
            console.log('[Attio Extractor] Skipping tracking email:', email);
            return;
          }
          
          // Skip if email looks like a tracking ID (long random string)
          if (email.match(/[a-f0-9]{20,}/i)) {
            console.log('[Attio Extractor] Skipping tracking ID email:', email);
            return;
          }
          
          processedEmails.add(email);
          
          // Look for name in the same line or previous lines
          let name = '';
          
          // Try same line first (remove email to get potential name)
          const sameLine = line.replace(email, '').trim();
          if (sameLine.length > 2 && sameLine.length < 100 && !sameLine.match(/^[\d\s]+$/)) {
            name = sameLine;
          }
          
          // If no name found, check previous line
          if (!name && index > 0) {
            const prevLine = lines[index - 1];
            if (prevLine.length > 2 && prevLine.length < 100 && !prevLine.includes('@')) {
              name = prevLine;
            }
          }
          
          // Extract phone if nearby
          const phones = [];
          const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
          
          // Check current and next few lines for phone
          for (let i = index; i < Math.min(index + 3, lines.length); i++) {
            const phoneMatches = lines[i].match(phoneRegex);
            if (phoneMatches) {
              phones.push(...phoneMatches);
            }
          }
          
          contacts.push({
            id: generateId(),
            name: name || 'Unknown',
            emails: [email],
            phones: [...new Set(phones)]
          });
          
          console.log('[Attio Extractor] Found contact:', { name, email, phones });
        });
      }
    });
    
    // Fallback: Try DOM-based extraction for better name detection
    if (contacts.length < 5) { // If we got very few contacts, try DOM method
      console.log('[Attio Extractor] Few contacts from text, trying DOM...');
      
      // Look for name elements in the visible list
      const nameElements = document.querySelectorAll('[class*="name"], strong, b, a[href*="/people/"]');
      nameElements.forEach(el => {
        const name = el.textContent?.trim();
        if (!name || name.length < 3 || name.length > 100) return;
        
        // Look for email in nearby elements
        const parent = el.closest('tr, li, div[role="row"], [class*="row"]');
        if (!parent) return;
        
        const parentText = parent.textContent || '';
        const emailMatch = parentText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
        
        if (emailMatch) {
          const email = emailMatch[0];
          const emailLower = email.toLowerCase();
          const shouldIgnore = ignoreDomains.some(domain => emailLower.includes(domain));
          
          if (!shouldIgnore && !processedEmails.has(email) && !email.match(/[a-f0-9]{20,}/i)) {
            processedEmails.add(email);
            
            const phoneMatch = parentText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            
            contacts.push({
              id: generateId(),
              name: name,
              emails: [email],
              phones: phoneMatch ? [phoneMatch[0]] : []
            });
            
            console.log('[Attio Extractor] Found contact via DOM:', { name, email });
          }
        }
      });
    }
    
    console.log('[Attio Extractor] Total contacts extracted:', contacts.length);
    return contacts;
  }

  function extractDeals() {
    console.log('[Attio Extractor] Starting deal extraction...');
    const deals = [];
    
    const allText = document.body.innerText || document.body.textContent;
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    
    // Look for lines with currency values
    const currencyRegex = /[$£€¥]\s*[\d,]+(?:\.\d{2})?/;
    const processed = new Set();
    
    lines.forEach((line, index) => {
      if (processed.has(line)) return;
      
      const valueMatch = line.match(currencyRegex);
      if (valueMatch) {
        processed.add(line);
        
        // Get deal name from previous line or same line
        let name = line.replace(valueMatch[0], '').trim();
        if (!name && index > 0) {
          name = lines[index - 1];
        }
        
        // Look for stage keywords
        let stage = '';
        const stageKeywords = ['discovery', 'proposal', 'negotiation', 'closed', 'won', 'lost', 'qualified'];
        for (let i = Math.max(0, index - 2); i < Math.min(index + 3, lines.length); i++) {
          const lower = lines[i].toLowerCase();
          for (const keyword of stageKeywords) {
            if (lower.includes(keyword)) {
              stage = keyword.charAt(0).toUpperCase() + keyword.slice(1);
              break;
            }
          }
          if (stage) break;
        }
        
        deals.push({
          id: generateId(),
          name: name || 'Unnamed Deal',
          value: valueMatch[0],
          stage: stage,
          company: ''
        });
        
        console.log('[Attio Extractor] Found deal:', { name, value: valueMatch[0], stage });
      }
    });
    
    console.log('[Attio Extractor] Total deals extracted:', deals.length);
    return deals;
  }

  function extractTasks() {
    console.log('[Attio Extractor] Starting task extraction...');
    const tasks = [];
    
    const allText = document.body.innerText || document.body.textContent;
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 200);
    
    const dateRegex = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}/i;
    const processed = new Set();
    
    // Look for checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      const parent = checkbox.closest('div, li, tr');
      if (!parent) return;
      
      const text = parent.textContent || '';
      const titleMatch = text.trim();
      
      if (titleMatch && titleMatch.length > 5 && !processed.has(titleMatch)) {
        processed.add(titleMatch);
        
        const dateMatch = text.match(dateRegex);
        
        tasks.push({
          id: generateId(),
          title: titleMatch.substring(0, 100),
          dueDate: dateMatch ? dateMatch[0] : null,
          assignee: '',
          done: checkbox.checked
        });
        
        console.log('[Attio Extractor] Found task:', { title: titleMatch.substring(0, 50), done: checkbox.checked });
      }
    });
    
    // Fallback: extract from text lines
    if (tasks.length === 0) {
      lines.slice(0, 50).forEach(line => {
        if (processed.has(line)) return;
        processed.add(line);
        
        const dateMatch = line.match(dateRegex);
        
        tasks.push({
          id: generateId(),
          title: line,
          dueDate: dateMatch ? dateMatch[0] : null,
          assignee: '',
          done: false
        });
      });
    }
    
    console.log('[Attio Extractor] Total tasks extracted:', tasks.length);
    return tasks;
  }

  console.log('[Attio Extractor] Content script ready');
})();