# Attio CRM Data Extractor

A Chrome Extension that extracts Contacts, Deals, and Tasks from Attio CRM, stores them locally, and displays them in a popup dashboard.

## Features

-  Extract contacts, deals, and tasks from Attio CRM
-  Store data locally with deduplication
-  React-based popup dashboard with search/filter
-  Shadow DOM visual feedback during extraction
-  Real-time sync across tabs
-  Export data as JSON or CSV
-  Delete individual records
-  Manifest V3 compliant

## Installation Steps

### 1. Prerequisites
- Node.js (v16 or higher)
- Chrome browser
- Attio account (free trial available at https://attio.com)

### 2. Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd attio-crm-extractor

# Install dependencies
npm install

# Build the extension
npm run build
```

### 3. Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from your project

### 4. Test the Extension
1. Log into your Attio account at https://app.attio.com
2. Navigate to a list view (People, Deals, or Tasks)
3. Click the extension icon in Chrome toolbar
4. Click "Extract Now" button
5. View extracted data in the popup

## DOM Selection Strategy

### Approach
We use **CSS Selectors** as the primary strategy for DOM extraction because:
- Attio uses semantic HTML with `role` attributes
- More maintainable than XPath
- Better performance than complex XPath queries
- Fallback-friendly for dynamic content

### Key Selectors
```javascript
// Table structure detection
document.querySelectorAll('[role="row"]')
document.querySelectorAll('[role="cell"]')

// Dynamic content waiting
document.querySelector('[role="table"], [data-testid*="list"]')

// Checkbox detection for tasks
cell.querySelector('[type="checkbox"]')
```

### Handling Dynamic Content
1. **Lazy Loading**: Implement `waitForContent()` with polling mechanism
2. **View Detection**: Parse URL patterns to determine current view type
3. **Mutation Observer**: Can be added to detect DOM changes and prompt re-extraction

### Data Extraction Logic

#### Contacts
- Name: First non-email/phone text cell
- Email: Regex pattern matching email format
- Phone: Regex pattern matching phone formats

#### Deals
- Name: First cell content
- Value: Currency pattern matching (`$` followed by numbers)
- Stage: Keywords like "qualified", "proposal", "negotiation"
- Company: Capitalized multi-word text

#### Tasks
- Title: First text cell
- Due Date: Date pattern matching
- Assignee: Person name format (capitalized words)
- Status: Checkbox checked state

## Storage Schema

```json
{
  "attio_data": {
    "contacts": [
      {
        "id": "contact_1736775000000_1",
        "name": "John Doe",
        "emails": ["john@example.com"],
        "phones": ["+1-555-0123"],
        "extractedAt": "2026-01-13T10:30:00.000Z"
      }
    ],
    "deals": [
      {
        "id": "deal_1736775000000_1",
        "name": "Enterprise Sale",
        "value": 50000,
        "stage": "Negotiation",
        "company": "Acme Corp",
        "extractedAt": "2026-01-13T10:30:00.000Z"
      }
    ],
    "tasks": [
      {
        "id": "task_1736775000000_1",
        "title": "Follow up call",
        "dueDate": "01/15/2026",
        "assignee": "Jane Smith",
        "done": false,
        "extractedAt": "2026-01-13T10:30:00.000Z"
      }
    ],
    "lastSync": 1736775000000
  }
}
```

### Data Integrity Features
- **Deduplication**: ID-based uniqueness check before insertion
- **Updates**: Existing items updated by ID match
- **Race Conditions**: Background service worker serializes storage operations
- **Sync**: `chrome.storage.onChanged` broadcasts updates to all contexts

## Architecture

### Components

#### 1. Content Script (`src/content/index.js`)
- Runs on all `*.attio.com` pages
- Extracts data from DOM
- Injects Shadow DOM status indicator
- Communicates with background script

#### 2. Background Service Worker (`src/background/index.js`)
- Manages chrome.storage operations
- Coordinates between content script and popup
- Handles deduplication logic
- Broadcasts storage changes

#### 3. Popup Dashboard (`src/popup/App.jsx`)
- React-based UI with TailwindCSS
- Three tabs: Contacts, Deals, Tasks
- Search/filter functionality
- Export (JSON/CSV) and delete operations

#### 4. Shadow DOM Indicator
- Isolated from page styles
- Shows extraction status (loading/success/error)
- Auto-dismisses after completion

### Message Passing Flow

```
Content Script → Background → Storage
     ↓              ↓            ↓
  Shadow DOM    Message     chrome.storage.local
     ↓           Relay           ↓
  User FB   ←  Popup  ←  Storage Change Event
```

## Project Structure

```
attio-crm-extractor/
├── src/
│   ├── popup/
│   │   ├── index.html
│   │   ├── index.jsx
│   │   └── App.jsx
│   ├── content/
│   │   └── index.js
│   ├── background/
│   │   └── index.js
│   └── utils/
│       └── storage.js
├── public/
│   ├── manifest.json
│   └── icon*.png
├── package.json
├── vite.config.js
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode (rebuild on changes)
npm run dev
```

## Bonus Features Implemented

 - Real-time sync across tabs using `chrome.storage.onChanged`
 - Export data as CSV or JSON
