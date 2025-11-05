# Filadefia Christian Center (FCC) Church Management System

A comprehensive Church Management System built for Filadefia Christian Center, a Tanzania Assemblies of God (TAG) church. This system helps manage members, departments, finances, attendance, communication, and events with a modern, user-friendly interface.

## 🎯 System Overview

The FCC Church Management System is designed to streamline church operations and enhance community engagement through:

- **Member Management**: Complete member profiles with department assignments
- **Department Organization**: All 12 TAG departments with leadership and reporting
- **Financial Tracking**: Tithes, offerings, donations, and expense management
- **Attendance System**: Service and event attendance with analytics
- **Communication Tools**: SMS, email, and WhatsApp notifications
- **Event Management**: Church programs and special events
- **Reporting & Analytics**: Comprehensive dashboards and reports

## 🚀 Features

### Core Modules

1. **Member Management**
   - Complete member registration and profiles
   - Department assignments and leadership roles
   - Membership card generation
   - Member status tracking (Active, Visitor, Transferred, Inactive)

2. **Department Management** (TAG Structure)
   - Youth Department (Vijana – TAG Youth Movement)
   - Women's Department (Wanawake wa TAG)
   - Men's Department (Wanaume wa TAG)
   - Children's Department (Watoto)
   - Evangelism Department
   - Choir & Praise Team
   - Prayer & Intercession Department
   - Ushering Department
   - Media & Technical Department
   - Discipleship & Teaching Department
   - Mission & Outreach Department
   - Welfare & Counseling Department

3. **Financial Management**
   - Income tracking (Tithes, Offerings, Donations)
   - Expense management
   - Mobile money integration (M-Pesa, TigoPesa, Airtel Money)
   - Financial reports and analytics

4. **Attendance Tracking**
   - Sunday services and midweek fellowships
   - Special events and department meetings
   - Attendance trends and analytics

5. **Communication System**
   - Bulk SMS and email notifications
   - WhatsApp integration
   - Church-wide and department announcements
   - Birthday and event reminders

6. **Event Management**
   - Event creation and management
   - Online registration and RSVP
   - Event attendance tracking

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS with custom FCC branding
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with role-based access
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Charts**: Recharts

## 🎨 Design System

The system uses FCC's brand colors:
- **Primary Blue**: #2563eb (FCC Blue)
- **Secondary Gold**: #f59e0b (FCC Gold) 
- **Background**: White with subtle gradients
- **Typography**: Inter font family

## 🔐 User Roles & Permissions

- **Administrator**: Full system access
- **Pastor**: Church oversight and reporting access
- **Treasurer**: Financial management access
- **Secretary**: Member and administrative data access
- **Department Leader**: Department-specific access
- **Member**: Personal profile and announcements access

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/quardcubelabs/filadefia-chms.git
cd filadefia-chms
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Church Information
NEXT_PUBLIC_CHURCH_NAME=Filadefia Christian Center
NEXT_PUBLIC_CHURCH_SHORT_NAME=FCC
NEXT_PUBLIC_CHURCH_DENOMINATION=Tanzania Assemblies of God (TAG)
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the database schema from `database/schema.sql`
3. Optionally, add seed data from `database/seed.sql`

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗂️ Project Structure

```
fcc-chms/
├── src/
│   ├── app/
│   │   ├── api/auth/          # Authentication API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/            # Login page
│   │   ├── signup/           # User registration (admin)
│   │   └── ...               # Other pages
│   ├── components/           # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   │   ├── supabase/        # Supabase configuration
│   │   └── auth.ts          # Authentication utilities
│   └── types/               # TypeScript type definitions
├── database/
│   ├── schema.sql           # Database schema
│   └── seed.sql            # Sample data
├── public/                 # Static assets
└── ...config files
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/quardcubelabs/filadefia-chms)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📞 Support

For technical support or questions:
- **Email**: it@fcc-tanzania.org
- **Phone**: +255 XXX XXX XXX
- **Location**: Dar es Salaam, Tanzania

## 📝 License

This project is private and proprietary to Filadefia Christian Center.

---

**Built with ❤️ for Filadefia Christian Center**  
*Serving the Tanzania Assemblies of God (TAG) Community*
