# Sree Vasa Printech — Pro-Flow System

A premium, high-efficiency production tracking system designed for printing operations. This application streamlines the workflow between operators and managers through real-time job card tracking and QR code integration.

## Key Features
- **Hands-Free Automation:** Global key-listener automatically detects hardware scanner input and routes to the correct page instantly based on barcode formats (Badge vs. Job Card).
- **Sticky Focus Guarantee:** The system aggressively pins cursor focus to input fields, ensuring zero input data is lost during high-speed shop floor scanning.
- **Offline Resilience:** Built-in smart fallback mechanism that loads local demo data if the production database goes offline, safely allowing uninterrupted testing.
- **Operator Entry Workflow:** A seamless 5-step guided process for status updates with auto-advance functionality.
- **Premium UI:** Clean, professional aesthetic using glassmorphism and modern typography.

## 🔗 Backend & Production Integration
This application operates as the frontend interface for the company's live production database. It is fully integrated with a **FastAPI backend** and a **PostgreSQL database**.

### Key Integrations:
- **Live Data Fetching**: Retrieves real-time job card details, machine assignments (`machineWoList`), and operator IDs directly from production.
- **Status Syncing**: Saves 7-step workflow progression (Initial → Delivered) instantly back to the live server.
- **Enterprise Features**: Designed for factory floors with session persistence (localStorage) and optimized input fields for handheld Android scanners.

### 🛡 Development Safety Mode
To prevent accidental changes to the production database during testing or training, a global safety switch is built-in:
```javascript
window.PRINTECH_DEV_MODE = true; // Set to false for live production writes
```
When active, the app fetches real data but blocks any status update `POST` requests, displaying a simulated success screen instead.

## How to Run

Follow these steps to get the application running on your computer.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or higher): [Download here](https://nodejs.org/)
- **Git**: [Download here](https://git-scm.com/)

Verify installation by running these in your terminal:
```bash
node --version
git --version
```

### 2. Repository Setup
Clone the project to your local machine:
```bash
git clone https://github.com/sreevasaa-project/Fullstack.git
cd Fullstack
cd printech-app
```

### 3. Installation
Install the necessary project dependencies:
```bash
npm install
```

### 4. Start the Application
Launch the development server:
```bash
npm run dev
```


### 5. Access the App
- The terminal will display a link like **`http://localhost:5173`**.
- **Ctrl + Click** the link or manually type it into your browser to open the app!

---

## Tech Stack
- **Frontend:** React 19 (Vite)
- **Styling:** Vanilla CSS with Dynamic Inline Styles
- **Fonts:** Lora, DM Sans, DM Mono (Google Fonts)
