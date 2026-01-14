// Storage manager for background context
class BackgroundStorage {
  constructor() {
    this.storageKey = 'attio_data';
  }

  async getData() {
    const result = await chrome.storage.local.get(this.storageKey);
    return result[this.storageKey] || {
      contacts: [],
      deals: [],
      tasks: [],
      lastSync: null
    };
  }

  async saveData(data) {
    await chrome.storage.local.set({
      [this.storageKey]: {
        ...data,
        lastSync: Date.now()
      }
    });
  }

  deduplicate(existing, newItems) {
    const map = new Map();
    existing.forEach(item => map.set(item.id, item));
    newItems.forEach(item => {
      if (map.has(item.id)) {
        map.set(item.id, { ...map.get(item.id), ...item });
      } else {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  async addData(dataType, newData) {
    const allData = await this.getData();
    allData[dataType] = this.deduplicate(allData[dataType], newData);
    await this.saveData(allData);
  }
}

const storage = new BackgroundStorage();

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveData') {
    storage.addData(request.dataType, request.data)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Popup will open automatically
});

console.log('Attio CRM Extractor service worker loaded');