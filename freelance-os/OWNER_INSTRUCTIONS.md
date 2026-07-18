# Owner Instructions: Getting FreelanceOS Up and Running

This guide explains exactly how to run the current version of FreelanceOS on your local machine and outlines the immediate next steps you need to take as the project owner to initiate the backend development phase.

## 1. Prerequisites

Before you start, ensure you have the following installed on your machine:
*   **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
*   **Git** - [Download here](https://git-scm.com/)
*   An **Anthropic API Key** (for Claude AI features) - [Get one here](https://console.anthropic.com/)

## 2. How to Run the App Locally (Current State)

Since the frontend prototype is fully built and uses your browser's local storage for data, you can run and interact with the entire app right now.

### Step 1: Open the Project
Open your terminal and navigate to the Next.js application directory:
```bash
cd /Users/Thunderops/Documents/Projects/new-apps/freelance-os/freelance-os-app
```

### Step 2: Install Dependencies
Install all required packages for the frontend and backend:
```bash
npm install
```

### Step 3: Configure Environment Variables
You need to provide your Anthropic API key for the AI features to work.

1.  In the `freelance-os-app` folder, create a file named `.env.local` (if it doesn't exist).
2.  Add the following line to the file:
    ```env
    ANTHROPIC_API_KEY=your_actual_api_key_here
    ```

*(Note: If you plan to test the Express backend for the Outreach Engine, ensure `backend/.env` also has the required keys configured).*

### Step 4: Start the Development Server
Run the following command to start the Next.js application:
```bash
npm run dev
```

### Step 5: View the App
Open your web browser and navigate to:
**http://localhost:3000**

You can now click through the navigation, create Briefs, generate Quotes, and track Finances. Note that all data is currently saved only to your local browser.

---

## 3. Your Immediate Next Steps (To start the Backend)

To move away from local storage and build a true backend, you (the owner) need to set up the infrastructure providers.

**1. Create a Supabase Account**
We highly recommend using Supabase for this stack (PostgreSQL Database + Authentication).
*   Go to [Supabase.com](https://supabase.com/) and create a free account.
*   Create a new Project (name it "FreelanceOS").
*   Once created, go to Project Settings -> API, and retrieve your **Project URL** and **anon public key**.

**2. Provide the Credentials to AI**
Once your Supabase project is ready, provide the following instruction to me (your AI assistant):
> *"I have set up Supabase. Here is my NEXT_PUBLIC_SUPABASE_URL=[your_url] and NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_key]. Let's start Phase 1 and 2 from the review document: Set up the database schema and authentication."*

**3. Decide on Backend Architecture**
Currently, there is an Express server in the `backend/` folder for the Outreach Engine, while the rest of the app is in Next.js. 
*   **Decision needed:** Do you want to keep the Express server separate, or would you prefer me to migrate the Outreach Engine logic into Next.js API Routes? (Migrating to Next.js API routes means you only have to host one codebase, which is usually cheaper and easier to maintain for MVPs). Let me know your preference when we begin!
