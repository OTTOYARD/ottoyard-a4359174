

## Plan: Add User Management Tab Inside Admin Settings

Add a "User Management" sub-section inside the existing `AdminGatedContent` component in `SettingsHub.tsx`. Once the admin password is entered, a new card will appear alongside the existing Simulator and AV Command panels, showing the user table with search, powered by the existing `admin-user-management` edge function.

### Changes

**File: `src/components/SettingsHub.tsx`**

1. **Expand `AdminGatedContent`** to include a new `AdminUserManagement` component after the existing simulator cards
2. The new component will:
   - Fetch users from the `admin-user-management` edge function (same one already built)
   - Display a searchable table with columns: Name, Email, Company, Role, Member Since, Last Login
   - Clicking a row opens the `UserDetailPanel` slide-out (already built) for viewing/editing
3. Import `UserDetailPanel` and reuse it directly
4. Add `Users` icon import from lucide-react (already imported in the file)

### What It Looks Like
- Admin tab → enter password → unlock reveals: Simulator Control, AV Command Simulator, **and now a User Management card** with a full data table and search bar
- Click any user row → slide-out panel with profile details and edit capability

### No New Files Needed
Reuses existing `admin-user-management` edge function and `UserDetailPanel` component. All changes are in `SettingsHub.tsx`.

