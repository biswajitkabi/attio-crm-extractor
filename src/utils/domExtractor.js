class DOMExtractor {
  constructor() {
    this.viewType = this.detectViewType();
  }

  detectViewType() {
    const url = window.location.href;
    
    if (url.includes('/people') || url.includes('/contacts')) {
      return 'contacts';
    } else if (url.includes('/deals')) {
      return 'deals';
    } else if (url.includes('/tasks')) {
      return 'tasks';
    }
    
    // Fallback: check page title or headings
    const pageTitle = document.title.toLowerCase();
    if (pageTitle.includes('people') || pageTitle.includes('contact')) return 'contacts';
    if (pageTitle.includes('deal')) return 'deals';
    if (pageTitle.includes('task')) return 'tasks';
    
    return null;
  }

  async waitForContent(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  extractContacts() {
    const contacts = [];
    
    // Strategy 1: Look for table/list rows
    const rows = document.querySelectorAll('[role="row"], tr, [data-row-id]');
    
    rows.forEach((row, index) => {
      try {
        const contact = {
          id: this.generateId(),
          name: '',
          emails: [],
          phones: [],
          extractedAt: Date.now()
        };

        // Extract name - try multiple selectors
        const nameEl = row.querySelector('[data-test-id*="name"], [class*="name"], td:first-child, [class*="Name"]');
        if (nameEl) {
          contact.name = nameEl.textContent.trim();
        }

        // Extract emails - look for email patterns
        const textContent = row.textContent;
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const emails = textContent.match(emailRegex);
        if (emails) {
          contact.emails = [...new Set(emails)];
        }

        // Extract phones - look for phone patterns
        const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = textContent.match(phoneRegex);
        if (phones) {
          contact.phones = [...new Set(phones)];
        }

        // Only add if we have at least a name or email
        if (contact.name || contact.emails.length > 0) {
          contacts.push(contact);
        }
      } catch (error) {
        console.error('Error extracting contact from row:', error);
      }
    });

    return contacts;
  }

  extractDeals() {
    const deals = [];
    
    const rows = document.querySelectorAll('[role="row"], tr, [data-row-id]');
    
    rows.forEach((row, index) => {
      try {
        const deal = {
          id: this.generateId(),
          name: '',
          value: null,
          stage: '',
          company: '',
          extractedAt: Date.now()
        };

        // Extract deal name
        const nameEl = row.querySelector('[data-test-id*="deal"], [class*="deal"], td:first-child, [class*="Name"]');
        if (nameEl) {
          deal.name = nameEl.textContent.trim();
        }

        // Extract value - look for currency patterns
        const textContent = row.textContent;
        const valueRegex = /[$£€]\s*[\d,]+(?:\.\d{2})?/;
        const valueMatch = textContent.match(valueRegex);
        if (valueMatch) {
          deal.value = valueMatch[0].replace(/[^0-9.]/g, '');
        }

        // Extract stage - common stage keywords
        const stageKeywords = ['discovery', 'proposal', 'negotiation', 'closed', 'won', 'lost', 'qualified', 'demo'];
        const lowerText = textContent.toLowerCase();
        for (const keyword of stageKeywords) {
          if (lowerText.includes(keyword)) {
            deal.stage = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            break;
          }
        }

        // Extract company
        const companyEl = row.querySelector('[data-test-id*="company"], [class*="company"], [class*="organization"]');
        if (companyEl) {
          deal.company = companyEl.textContent.trim();
        }

        if (deal.name) {
          deals.push(deal);
        }
      } catch (error) {
        console.error('Error extracting deal from row:', error);
      }
    });

    return deals;
  }

  extractTasks() {
    const tasks = [];
    
    const rows = document.querySelectorAll('[role="row"], tr, [data-row-id], [class*="task"]');
    
    rows.forEach((row, index) => {
      try {
        const task = {
          id: this.generateId(),
          title: '',
          dueDate: null,
          assignee: '',
          done: false,
          extractedAt: Date.now()
        };

        // Extract title
        const titleEl = row.querySelector('[data-test-id*="title"], [class*="title"], td:first-child, [class*="Title"]');
        if (titleEl) {
          task.title = titleEl.textContent.trim();
        }

        // Extract due date - look for date patterns
        const textContent = row.textContent;
        const dateRegex = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i;
        const dateMatch = textContent.match(dateRegex);
        if (dateMatch) {
          task.dueDate = dateMatch[0];
        }

        // Extract assignee
        const assigneeEl = row.querySelector('[data-test-id*="assignee"], [class*="assignee"], [class*="assigned"]');
        if (assigneeEl) {
          task.assignee = assigneeEl.textContent.trim();
        }

        // Check if done - look for checkboxes or "done" status
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox) {
          task.done = checkbox.checked;
        } else {
          task.done = textContent.toLowerCase().includes('complete') || 
                     textContent.toLowerCase().includes('done');
        }

        if (task.title) {
          tasks.push(task);
        }
      } catch (error) {
        console.error('Error extracting task from row:', error);
      }
    });

    return tasks;
  }

  async extractData() {
    // Wait for content to load
    await this.waitForContent('[role="row"], tr, table');
    
    switch (this.viewType) {
      case 'contacts':
        return { type: 'contacts', data: this.extractContacts() };
      case 'deals':
        return { type: 'deals', data: this.extractDeals() };
      case 'tasks':
        return { type: 'tasks', data: this.extractTasks() };
      default:
        throw new Error('Unknown view type. Please navigate to Contacts, Deals, or Tasks page.');
    }
  }

  async handlePagination() {
    const allData = [];
    const currentData = await this.extractData();
    allData.push(...currentData.data);

    // Look for "Next" or pagination buttons
    let nextButton = document.querySelector('[aria-label*="next" i], button:has-text("Next"), [class*="next"]');
    let attempts = 0;
    const maxPages = 10; // Safety limit

    while (nextButton && !nextButton.disabled && attempts < maxPages) {
      nextButton.click();
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for page load
      
      const pageData = await this.extractData();
      allData.push(...pageData.data);
      
      nextButton = document.querySelector('[aria-label*="next" i], button:has-text("Next"), [class*="next"]');
      attempts++;
    }

    return { type: currentData.type, data: allData };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMExtractor;
}