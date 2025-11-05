# Git Setup Commands for filadefia-chms Repository

## After creating the GitHub repository "filadefia-chms" in quardcubelabs account:

### 1. Initialize Git (if not already done)
```bash
cd fcc-chms
git init
```

### 2. Add all files to Git
```bash
git add .
```

### 3. Create initial commit
```bash
git commit -m "Initial commit: FCC Church Management System

- Complete Next.js 14 setup with TypeScript and TailwindCSS
- Supabase integration for authentication and database
- FCC branding with blue and gold color scheme
- Database schema for all church management features
- Authentication system with role-based access control
- Landing page, login, signup, and dashboard pages
- Complete type definitions for church management
- Ready for deployment on Vercel"
```

### 4. Add GitHub remote (replace with your actual repository URL)
```bash
git remote add origin https://github.com/quardcubelabs/filadefia-chms.git
```

### 5. Set main branch and push
```bash
git branch -M main
git push -u origin main
```

## Alternative: If you already have a Git repository
```bash
git remote add origin https://github.com/quardcubelabs/filadefia-chms.git
git branch -M main
git push -u origin main
```

## Environment Variables to Set in GitHub/Vercel:
When deploying, make sure to set these environment variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_CHURCH_NAME
- NEXT_PUBLIC_CHURCH_SHORT_NAME
- NEXT_PUBLIC_CHURCH_DENOMINATION

## Next Steps After Repository Creation:
1. Create Supabase project
2. Run database schema from /database/schema.sql
3. Update .env.local with actual Supabase credentials
4. Deploy to Vercel
5. Set up domain (optional)
6. Configure SMS/Email providers (optional)