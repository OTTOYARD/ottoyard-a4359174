

## Plan: Admin User Management Dashboard

Build an admin-only backend user management page to view, search, and manage all registered users — similar to a lightweight CRM.

### What You Get
- A new `/admin/users` route (admin-only) with a searchable table of all users
- Each user row shows: name, email, company, sign-up date, last login, role
- Click a user to view/edit their profile details
- Activity log viewer per user (leveraging existing `activity_logs` table)
- Edge function to fetch user list from `auth.users` joined with `profiles` (since `auth.users` isn't accessible from the client)

### Technical Approach

**1. New Edge Function: `admin-user-management`**
- Uses service role key to query `auth.users` joined with `profiles` and `user_roles`
- Endpoints: `GET /list` (paginated, searchable), `GET /detail/:id`, `POST /update/:id`
- Validates caller has admin role via `has_role()` check
- Returns: id, email, full_name, username, company_name, phone, created_at, last_sign_in_at, role, account_summary

**2. New Page: `src/pages/AdminUsers.tsx`**
- Data table with columns: Name, Email, Company, Role, Member Since, Last Login
- Search bar filtering by name/email/company
- Click row to open detail panel (slide-out or dialog) showing full profile + edit capability
- Badge indicators for role (admin/user/moderator)
- Protected by admin role check

**3. New Component: `src/components/admin/UserDetailPanel.tsx`**
- Shows full profile fields, activity logs, order history summary
- Edit capability for profile fields and role assignment
- Account summary stats from `account_summary_jsonb`

**4. Route & Navigation**
- Add `/admin/users` route in `App.tsx` wrapped in `ProtectedRoute`
- Admin role check on page load (redirect non-admins)

**5. No new database tables needed** — uses existing `profiles`, `user_roles`, `activity_logs`, and `auth.users` (via edge function with service role)

### Files to Create/Modify
- **Create** `supabase/functions/admin-user-management/index.ts`
- **Create** `src/pages/AdminUsers.tsx`
- **Create** `src/components/admin/UserDetailPanel.tsx`
- **Modify** `src/App.tsx` — add admin route
- **Modify** `supabase/config.toml` — add function config

