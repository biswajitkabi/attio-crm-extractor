class StorageManager {
  constructor() {
    this.storageKey = 'attio_data';
  }

  async getData() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || this.getDefaultSchema();
    } catch (error) {
      console.error('Error getting data:', error);
      return this.getDefaultSchema();
    }
  }

  getDefaultSchema() {
    return {
      contacts: [],
      deals: [],
      tasks: [],
      lastSync: null
    };
  }

  async saveData(data) {
    try {
      await chrome.storage.local.set({
        [this.storageKey]: {
          ...data,
          lastSync: Date.now()
        }
      });
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  async addContacts(newContacts) {
    const data = await this.getData();
    const deduplicated = this.deduplicateContacts(data.contacts, newContacts);
    data.contacts = deduplicated;
    return await this.saveData(data);
  }

  async addDeals(newDeals) {
    const data = await this.getData();
    const deduplicated = this.deduplicateDeals(data.deals, newDeals);
    data.deals = deduplicated;
    return await this.saveData(data);
  }

  async addTasks(newTasks) {
    const data = await this.getData();
    const deduplicated = this.deduplicate(data.tasks, newTasks);
    data.tasks = deduplicated;
    return await this.saveData(data);
  }

  deduplicateContacts(existing, newItems) {
    const map = new Map();
    
    existing.forEach(item => {
      const key = this.getContactKey(item);
      map.set(key, item);
    });

    newItems.forEach(item => {
      const key = this.getContactKey(item);
      if (map.has(key)) {
        // Update existing
        map.set(key, { ...map.get(key), ...item, extractedAt: Date.now() });
      } else {
        map.set(key, { ...item, extractedAt: Date.now() });
      }
    });

    return Array.from(map.values());
  }

  deduplicateDeals(existing, newItems) {
    const map = new Map();
    
    existing.forEach(item => {
      map.set(item.id, item);
    });

    newItems.forEach(item => {
      if (map.has(item.id)) {
        map.set(item.id, { ...map.get(item.id), ...item, extractedAt: Date.now() });
      } else {
        map.set(item.id, { ...item, extractedAt: Date.now() });
      }
    });

    return Array.from(map.values());
  }

  deduplicate(existing, newItems) {
    const map = new Map();
    
    existing.forEach(item => {
      map.set(item.id, item);
    });

    newItems.forEach(item => {
      if (map.has(item.id)) {
        map.set(item.id, { ...map.get(item.id), ...item, extractedAt: Date.now() });
      } else {
        map.set(item.id, { ...item, extractedAt: Date.now() });
      }
    });

    return Array.from(map.values());
  }

  getContactKey(contact) {
    const email = contact.emails?.[0] || '';
    const name = contact.name || '';
    return `${email}-${name}`.toLowerCase();
  }

  async deleteContact(id) {
    const data = await this.getData();
    data.contacts = data.contacts.filter(c => c.id !== id);
    return await this.saveData(data);
  }

  async deleteDeal(id) {
    const data = await this.getData();
    data.deals = data.deals.filter(d => d.id !== id);
    return await this.saveData(data);
  }

  async deleteTask(id) {
    const data = await this.getData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    return await this.saveData(data);
  }

  async clearAllData() {
    return await this.saveData(this.getDefaultSchema());
  }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
} 