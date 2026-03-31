# Duty-Leave Manager 🎓

Check it out live:
https://duty-leave-manager.netlify.app/

A modern, real-time web application built for colleges and universities to digitally manage student duty leaves. It streamlines the entire process—from student applications and document uploads to multi-tier faculty approvals.

## 🚀 Key Features

### For Students
*   **Apply for Leaves:** Submit single-day (requires subject-wise approval) or multi-day (requires bulk approval) duty leave requests.
*   **Document Vault:** Securely upload mandatory Permission Slips/Brochures when applying. Keep your Participation Certificates organized post-event.
*   **Real-time Dashboard:** Instantly see the status of your requests and track the total number of approved duty leaves taken over the semester.

### For Administrators/Faculty
*   **Smart Approvals:** Click-to-approve single-day leaves subject-by-subject (AAD, DATA ANALYTICS, IEFT, etc.).
*   **Detailed Context:** View student names, exact dates, and the specific reason for every request directly in the pending card wrapper.
*   **Decision History:** Keep a permanent record of all finalized (Approved or Rejected) requests in the History section.

### Under the Hood
*   **Real-time Synchronization:** Built with Supabase Realtime. Approvals instantly reflect on the student's dashboard without needing to refresh the page.
*   **Email Notifications:** Integrated with the EmailJS SDK to automatically send an email to the concerned faculty advisor whenever a student submits a new application.
*   **Role-Based Security:** Row-Level Security (RLS) ensures students can only view their own data, while admins can view and update organizational records.

---

## 🛠️ Technology Stack

*   **Frontend:** Pure HTML5, Vanilla CSS (Glassmorphism UI), and Vanilla JavaScript
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth (Email & Password)
*   **File Storage:** Supabase Storage Buckets
*   **Email API:** EmailJS

---

## ⚙️ Setup & Installation

Because this application relies on a **BaaS (Backend-as-a-Service)** architecture using Supabase, you do not need to boot a Local Node.js or Python server to run it. 

### 1. Database Configuration
If you are deploying this for the first time, you must run the included SQL scripts in your Supabase project's SQL Editor to scaffold the database:

1.  Run `supabase_schema.sql` (Creates `profiles`, `leaves`, and authentication triggers)
2.  Run `supabase_alter_leaves.sql` (Adds the `reason` column for admin context)
3.  Run `supabase_storage.sql` (Initializes the Storage Buckets and policies for document uploads)

### 2. API Keys
Before hosting, insert your API keys into the codebase:

*   **Supabase:** Open `supabase.js` and replace the initialization variables with your actual Supabase Project URL and Anon Public Key.
*   **EmailJS (Optional):** Open `index.html` (line ~175) and `app.js` (line ~299) to insert your specific EmailJS `PUBLIC_KEY`, `SERVICE_ID`, and `TEMPLATE_ID`. Check your EmailJS dashboard for these.

### 3. Hosting / Running Locally
*   **Locally:** Simply double-click `login.html` to open it in any web browser.
*   **Hosting:** Drag and drop the entire project folder into **Netlify Drop** or host it for free via **GitHub Pages**. Since it's a static frontend, there is absolutely no build step required!

---

## 👥 Accounts & Registration

To get started, simply open `register.html` in your browser and create an account — no manual Supabase configuration needed. The registration page handles account creation automatically via Supabase Auth.

*   Choose **Student** or **Admin** mode before submitting the form.
*   You can use a plain username (e.g. `john`) and it will be stored as `john@example.com`, or enter a full email address.
*   Password must be at least **6 characters**, contain one **uppercase letter**, and one **number**.

> **Tip:** For quick testing, just register a new account — it takes seconds and no Supabase dashboard access is required.
