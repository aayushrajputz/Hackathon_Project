# 🛠 Admin Dashboard Implementation Plan (BinaryPDF) - COMPLETED ✅

Goal: Build a high-performance, visually stunning admin panel to manage users, monitor growth, and control system resources.

## 1. Architecture 🏗
- **Frontend**: Next.js (Dashboard layout) under `/admin` route.
- **State Management**: Zustand (for admin-specific global state).
- **Visualization**: Recharts/CSS Gauges (for analytics).
- **Backend**: Go with AdminMiddleware & MongoDB aggregations.

## 2. Admin Features List 🚀

### A. Dashboard Overview (The "At a Glance" View) ✅
- **KPI Cards**:
    - Total Users (with % growth).
    - Total PDFs Processed.
    - Total Revenue (Mocked for visual, hooks ready).
    - Active Subscriptions (Student vs Pro vs Plus vs Business).
- **Growth Chart**: Daily new users (Last 30 days).
- **Storage Gauge**: Total MinIO storage used vs Cluster capacity.

### B. User Management (The CRM) ✅
- **Table**: UID, Email, Plan, Role, CreatedAt.
- **Filters**: Search by email, Filter by Plan.
- **Actions**:
    - `Change Plan`: Manually upgrade/downgrade users.
    - `Assign Role`: Promote users to Admin.
    - `Security`: Reset password link or Suspend account.

### C. Document Explorer ✅
- **View All**: List every PDF uploaded across the platform.
- **Metadata**: See page counts, OCR status, and AI analysis cost.
- **Cleanup**: Manual trigger to purge orphaned files.

### D. Revenue & Payments ✅
- **Transaction Log**: Real-time feed of (mocked) Razorpay payments.
- **Churn Rate**: Monitor subscription cancellations.

---

## 3. Engineering Angles (Interview Gold) 🧠
- **RBAC (Role Based Access Control)**: Implementing middleware that checks JWT claims + DB roles.
- **Optimized Aggregations**: Using MongoDB `$facet` and `$group` to compute stats in one trip instead of multiple queries.
- **Plan Enforcement**: Defined `config/plans.go` with strict caps (25MB, 100MB, etc.).

## 4. Design Guidelines 🎨
- **Theme**: Dark mode by default (Sleek professional look).
- **Components**: Glassmorphism cards, blurred backgrounds, and subtle micro-animations on hover.

---

## 5. Immediate Next Steps 🏃‍♂️
1. [x] Add `Role` field to User Model.
2. [x] Create `AdminMiddleware` in Go.
3. [x] Create `AdminHandler` with `/stats`, `/users`, and `/documents` endpoints.
4. [x] Create `/admin` layout in Next.js.
5. [x] Build the `StatsOverview` component.
6. [x] Build the `UserList` table with search.
7. [x] Build the `DocumentExplorer` (Card view).
8. [x] Build the `RevenueAnalytics` (Premium UI).
9. [x] Update Pricing Tiers (Student, Pro, Plus, Business).
