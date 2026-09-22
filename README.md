# CampusWhop

> The operating system for African student entrepreneurs.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-campuswhop.com-0A0F0D?style=flat-square)](https://www.campuswhop.com/)

CampusWhop is a full-stack student commerce platform built for university
students who want to sell products, offer services, take bookings, find
opportunities, and build a reputation around their work.

The platform is currently launched at Alex Ekwueme Federal University
Ndufu-Alike (FUNAI).

## 🚀 Live Application

**https://www.campuswhop.com/**

## ✨ Core Features

### Creator Profiles
Students can create profiles showcasing their skills, services, and
products, allowing other students to discover and connect with them.

### Marketplace
A marketplace for physical and digital products with transaction workflows
designed around buyer and seller protection.

### Student Stores
Creators can establish their own storefronts and manage multiple products
under a single campus-facing brand.

### Booking System
Service providers can offer bookable sessions and allow students to
request and manage appointments.

### Gigs & Jobs
Students can discover freelance gigs, jobs, internships, and other paid
opportunities.

### Opportunities Hub
A centralized space for scholarships, internships, competitions, grants,
and other opportunities relevant to Nigerian university students.

### Subscriptions
Creators can offer recurring subscription plans for content, mentorship,
services, and other offerings.

### Messaging
Built-in communication workflows allow users to interact within the
platform.

### Reviews & Reputation
Completed transactions and interactions can contribute to a user's
reputation and review history.

### Payments
CampusWhop integrates payment infrastructure for marketplace transactions
and creator monetization.

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend & Data
- Supabase
- PostgreSQL
- Supabase Authentication
- Server-side application actions

### Payments & Services
- Paystack
- Resend
- Backblaze B2

### Infrastructure
- Vercel
- GitHub

## 🏗️ Project Structure

```text
src/
├── app/
│   ├── admin/
│   ├── bookings/
│   ├── coins/
│   ├── creator-dashboard/
│   ├── creators/
│   ├── dashboard/
│   ├── featured/
│   ├── gigs/
│   ├── jobs/
│   ├── marketplace/
│   ├── messages/
│   ├── novels/
│   ├── onboarding/
│   ├── opportunities/
│   ├── orders/
│   ├── profile/
│   ├── referrals/
│   ├── reviews/
│   ├── seller/
│   ├── store/
│   └── subscriptions/
│
├── components/
│   ├── admin/
│   ├── shared/
│   ├── store/
│   └── ui/
│
├── lib/
│   ├── actions/
│   ├── paystack/
│   ├── resend/
│   ├── storage/
│   ├── supabase/
│   └── validations/
│
├── trigger/
└── types/

🔐 Authentication & Security
Authentication is handled through Supabase Auth, including Google OAuth.
Environment-specific credentials are kept outside the repository.
Create a local .env.local file using .env.example as a reference.
Never commit .env.local or production credentials to GitHub.

⚙️ Local Development
1. Clone the repository
git clone https://github.com/sketch-466/CampusWhop.git
cd CampusWhop
2. Install dependencies
npm install
3. Configure environment variables
Create a .env.local file and provide the required environment variables listed in .env.example.
4. Start the development server
npm run dev
The application will be available at:
http://localhost:3000

🌐 Deployment
CampusWhop is deployed using Vercel.
The production application is available at:
https://www.campuswhop.com/⁠�

📌 Product Direction
CampusWhop started as a campus-focused marketplace and evolved into a broader student commerce platform.
The goal is to provide students with infrastructure for:
Selling products
Offering services
Accepting bookings
Finding paid work
Monetizing digital content
Building a public track record
Discovering relevant opportunities

👨🏽‍💻 Built By
Isaac Chidiebere Agu
Engineering Student & Full-Stack Developer
GitHub: https://github.com/sketch-466⁠�
CampusWhop: https://www.campuswhop.com/⁠�

📄 License
This project is currently proprietary.
All rights reserved.