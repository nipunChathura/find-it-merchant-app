# Find It Merchant App – UI Architecture

## 1. UI Architecture

- **Screens**: Expo Router file-based under `app/(tabs)/`. Dashboard = index; Outlets, Payments, Profile = separate tab files.
- **Components**: Reusable UI in `components/dashboard/` (SummaryCard, ActionButton, OutletCard, NotificationItem, ScreenContainer, SectionHeader, EmptyState, SummaryCardSkeleton). Theme tokens from `theme/`.
- **State**: Auth via `context/auth-context`; dashboard data via `useDashboardData()`; role via `useRole()`.
- **Data**: Services in `services/` (dashboardService, outletService) return role-aware data; hooks call services and expose loading/refreshing/error.

## 2. Component Tree (Dashboard)

```
ScreenContainer (ScrollView + RefreshControl)
├── Header (welcome, subtitle, notification icon + badge, avatar)
├── Section: Summary Cards
│   └── 2x2 Grid → SummaryCard x4 (or SummaryCardSkeleton when loading)
├── Section: Quick Actions
│   └── SectionHeader + 2x2 ActionButton
├── Section: Outlet Preview
│   └── SectionHeader ("View All") + OutletCard[] or EmptyState
└── Section: Recent Notifications
    └── SectionHeader + NotificationItem[] or EmptyState
```

## 3. Folder Structure

```
app/
  (tabs)/
    _layout.tsx    # Bottom tabs: Dashboard, Outlets, Payments, Profile
    index.tsx     # Dashboard screen
    outlets.tsx
    payments.tsx
    profile.tsx
  login.tsx, forgot-password.tsx, index.tsx (auth redirect)
components/
  dashboard/      # SummaryCard, ActionButton, OutletCard, NotificationItem,
                  # ScreenContainer, SectionHeader, EmptyState, SummaryCardSkeleton
  ui/             # Existing (haptic-tab, icon-symbol, etc.)
constants/        # api.ts, theme (legacy)
context/          # auth-context
hooks/            # useDashboardData, useRole, useColorScheme, useThemeColor
services/         # api (login), dashboardService, outletService
theme/            # colors, spacing, typography
types/            # dashboard (UserRole, DashboardSummary, Outlet, Notification, etc.)
```

## 4. Theme System

- **theme/colors.ts**: primary #2563EB, secondary #1E40AF, background #F8FAFC, card #FFFFFF, textPrimary #0F172A, accent #38BDF8, success/warning/error badges.
- **theme/spacing.ts**: 8px grid (xxs–xxxl), borderRadius, cardRadius 16.
- **theme/typography.ts**: fontWeights, fontSizes, lineHeights.
- Screens and dashboard components import from `@/theme`; navigation still uses `constants/theme` for compatibility.

## 5. Navigation

- **Root**: Stack (index → login or (tabs)).
- **Tabs**: Dashboard (index), Outlets, Payments, Profile. Each tab is a single screen; stacks per tab can be added later under e.g. `(tabs)/outlets/_layout.tsx`.

## 6. Role-Based Rendering

- **useRole()**: Derives `MERCHANT` | `SUBMERCHANT` from auth user.role (maps SUB_MERCHANT → SUBMERCHANT).
- **Data**: `dashboardService.fetchOutletsForRole(role, token)` – Sub-Merchant gets only outlets with `assignedToSubMerchant: true`; Merchant gets all.
- **UI**: Same dashboard layout; section titles/copy can vary (e.g. “My Outlets” vs “All Outlets”). No duplicated screens; conditional copy and service layer handle role.

## 7. Production-Ready Dashboard Screen

Implemented in `app/(tabs)/index.tsx`: header, 2x2 summary cards (with skeleton), quick actions, outlet preview (first 5 + View All), recent notifications (3). Uses `useDashboardData()` and `useRole()`; pull-to-refresh and empty states included.

## 8. SummaryCard Component

See `components/dashboard/SummaryCard.tsx`: icon, title, value, optional subtext; accent top border (#2563EB), white card, 16px radius, soft shadow.

## 9. OutletCard Component

See `components/dashboard/OutletCard.tsx`: outlet name, status badge (Open/Closed), payment status badge (Paid/Pending/Overdue), item count, chevron; pressable; badge colors from theme (success/warning/error).
