# DoseLoop

![DoseLoop Cover Image](https://via.placeholder.com/1200x600/0f172a/ffffff?text=DoseLoop+-+The+Calm+Medication+Tracker)

DoseLoop is a highly polished, privacy-first, and resilient medication and wellness tracker designed to bring peace of mind. Instead of stressful alerts and confusing dashboards, DoseLoop provides a calm, beautifully crafted interface that aggregates health metrics, tracks complex medication schedules, and keeps chosen family members gently informed without feeling invasive.

## Project Overview

DoseLoop bridges the gap between clinical rigidity and daily lifestyle. It is built to manage everything from simple vitamins to complex, critical regimens. Its unique "Family Circle" architecture allows users to share their well-being status with designated caregivers or family members while strictly maintaining boundaries and granular privacy controls. The application includes a smart AI assistant to answer general wellness inquiries contextually and a robust SOS emergency feature.

## Features

- **Advanced Medication Engine:** Handle multiple doses per day, complex recurrences, and custom schedules.
- **Family Circle:** Invite trusted caregivers and family members with fine-grained visibility controls (share medications vs. share wellness).
- **Calm Reminders:** Non-intrusive yet effective notifications to ensure adherence.
- **Wellness Tracking:** Log mood, hydration, and custom health metrics with beautiful, dynamic health rings.
- **AI Assistant:** An integrated, privacy-focused AI to ask general health, medication, and wellness questions.
- **Emergency SOS:** Immediately notify designated primary contacts during an emergency with one tap.
- **Full Privacy Controls:** Export your data, revoke access instantly, and toggle global privacy modes.
- **Dark/Light Mode:** A gorgeous, meticulously crafted UI with support for system-based and manual theme toggling.

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, TanStack Router, TanStack Query, Radix UI, Lucide Icons.
- **Backend:** Node.js, Express, TypeScript.
- **Database / ORM:** PostgreSQL, Prisma ORM.
- **Authentication & Core DB:** Supabase.
- **AI Integration:** Groq API.
- **Email Delivery:** Resend.

## Architecture

DoseLoop strictly separates the client and server. The client is a robust Single Page Application (SPA) communicating over a RESTful JSON API with the Node.js Express server. The server acts as a secure middleware and orchestration layer, handling business logic, transaction safety (via Prisma), and abstracting the Supabase REST/Auth layers, Groq, and Resend integrations. The database relies on a PostgreSQL schema meticulously designed for relational integrity.

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account
- A Groq API key
- (Optional) A Resend API key for email delivery

### Environment Variables

Both the client and server require environment variables to run. Example files have been provided.

**Client (`client/.env.example`)**:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000/api/v1
```

**Server (`server/.env.example`)**:
```env
DATABASE_URL=postgres://user:password@host:port/db?schema=public
DIRECT_URL=postgres://user:password@host:port/db?schema=public
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-supabase-jwt-secret
GROQ_API_KEY=your-groq-api-key
RESEND_API_KEY=your-resend-api-key
PORT=5000
```

Rename `.env.example` to `.env` in both the `client` and `server` directories and populate them with your actual keys. **Never commit these files to version control.**

### Database Setup

DoseLoop uses Prisma ORM to interact with PostgreSQL.

1. Navigate to the `server` directory.
2. Push the schema to your Supabase database:
   ```bash
   npx prisma db push
   ```
3. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

### Supabase Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Go to Project Settings -> API to retrieve your `URL`, `anon` key, and `service_role` key.
3. Use the Database connection strings for your `DATABASE_URL` and `DIRECT_URL`.
4. Ensure Email/Password authentication is enabled in the Auth settings.

### Groq Setup

1. Create an account at [Groq Console](https://console.groq.com).
2. Generate an API Key and place it in the server's `GROQ_API_KEY` variable.

### Resend Setup (Optional)

1. Create an account at [Resend](https://resend.com).
2. Add and verify your domain.
3. Generate an API Key and add it to `RESEND_API_KEY`.

## Running the Application

### Running Server

From the root directory:
```bash
cd server
npm install
npm run dev
```
The server will start at `http://localhost:5000`.

### Running Client

Open a new terminal from the root directory:
```bash
cd client
npm install
npm run dev
```
The client will start at `http://localhost:5173`.

## Production Deployment (Vercel Serverless)

DoseLoop is configured to deploy seamlessly as a full-stack Serverless application on Vercel. 

Both the React frontend and the Express backend run on Vercel under a single domain.

### Steps to Deploy on Vercel

1. **Push to GitHub**: Push your complete `DOSELOOP` repository to a new GitHub repo.
2. **Import Project**: Log in to Vercel, click **Add New Project**, and import your GitHub repository.
3. **Framework Preset**: Vercel will auto-detect the configuration using `vercel.json`. Leave it as `Other`.
4. **Root Directory**: Leave as `./` (Root).
5. **Environment Variables**: Add ALL variables from both `server/.env` and `client/.env`.
   - Set `VITE_API_URL` to `/api/v1`
   - Ensure you generate a secure `CRON_SECRET`
6. **Deploy**: Click Deploy. Vercel will simultaneously build the Vite frontend and deploy the Express backend as Serverless Functions.

### Background Reminders (Cron)

Since the backend runs as serverless functions, long-running processes like `node-cron` cannot run continuously.
To enable medication reminders:
1. Go to your Vercel Project Settings.
2. Ensure you have added a `vercel.json` crons block (or configure it in the dashboard) to ping `/api/v1/cron/reminders` every minute.
3. Vercel will send a `Bearer` token matching your `CRON_SECRET` to execute the reminders safely.

## Folder Structure

```
DOSELOOP/
├── client/                 # Frontend React Application
│   ├── public/             # Static public assets
│   ├── src/                # React source code (components, routes, lib)
│   └── package.json        # Client dependencies
├── server/                 # Backend Node.js/Express Application
│   ├── prisma/             # Database schema and migrations
│   ├── src/                # Express source code (controllers, services)
│   └── package.json        # Server dependencies
├── docs/                   # Additional documentation
├── .gitignore              # Production-grade Git ignore rules
├── README.md               # This file
└── LICENSE                 # MIT License
```

## Screenshots

*(Placeholder: Add high-quality screenshots of the Dashboard, Medications, Family Circle, and AI Assistant here)*

## Contributing

Contributions are welcome! Please read the `CONTRIBUTING.md` file for guidelines on how to submit pull requests, report issues, and suggest enhancements.

## Future Roadmap

- **Advanced Wearable Integrations:** Sync data directly from Apple Health and Google Fit.
- **Enhanced AI Insights:** Predictive wellness reports and interactive check-ins.
- **Pharmacy Integrations:** Automatic refill requests and tracking.
- **Localization:** Support for Spanish, French, and German.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
