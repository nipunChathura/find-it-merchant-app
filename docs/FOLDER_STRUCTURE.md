# FIND IT Merchant App – Folder Structure

```
app/
  _layout.tsx              # Root: SafeAreaProvider, AuthProvider, Stack (auth + tabs)
  index.tsx                # Splash/redirect: login or (tabs)
  login.tsx
  register.tsx
  forgot-password.tsx
  reset-password.tsx
  (tabs)/
    _layout.tsx            # Bottom Tabs: Dashboard, Outlets, Payments, Notifications, Profile
    index.tsx              # Dashboard
    outlets/
      _layout.tsx          # Stack: list, add, [id]
      index.tsx            # Outlet list
      add.tsx              # Add outlet
      [id].tsx             # Outlet detail (Info / Items / Schedule / Payments)
    payments.tsx
    notifications.tsx
    profile.tsx

components/
  dashboard/               # SummaryCard, OutletCard, ActionButton, SectionHeader, etc.
  ui/                      # AppInput, PrimaryButton, SecondaryButton, LoadingSpinner

hooks/
  useRole.ts
  useDashboardData.ts
  useColorScheme.ts
  useThemeColor.ts

services/
  api.ts                   # login (fetch)
  authService.ts           # Axios: login, register, forgotPassword, resetPassword
  outletService.ts         # Axios + fetchOutlets
  itemService.ts
  paymentService.ts
  dashboardService.ts      # Mock summary, outlets, notifications

theme/
  colors.ts
  spacing.ts               # 8px grid, page: 10, cardRadius: 16, inputRadius: 12
  typography.ts
  index.ts

utils/
  apiClient.ts             # Axios instance + auth header from SecureStore

types/
  dashboard.ts
  index.ts

constants/
  api.ts
  theme.ts                 # Legacy Colors for navigation

context/
  auth-context.tsx
```

## Navigation

- **AuthStack**: index → login | (tabs); login ↔ register, forgot-password, reset-password.
- **MainTabs**: Dashboard, Outlets (Stack), Payments, Notifications, Profile.
- **OutletStack**: index (list) → add, [id] (detail).

## Theme

- Primary: #2563EB, Secondary: #1E40AF, Background: #F8FAFC, Text: #0F172A, Accent: #38BDF8.
- 10px page padding, 16px card radius, 12px input radius.
