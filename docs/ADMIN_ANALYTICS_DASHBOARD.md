# Admin Analytics & Performance Dashboard

## Overview
A comprehensive Power BI-style analytics dashboard for admin users to monitor overall school performance and class-wise analytics.

## Features Implemented

### 1. API Endpoint
**Path**: `/api/admin/analytics-overview`
- Returns comprehensive analytics including:
  - Overall school statistics
  - Class-wise performance data
  - Grade distribution
  - Risk level analysis
  - 6-month performance trends
  - Attendance rates

### 2. Dashboard Page
**Path**: `/admin/analytics`

#### Overall Statistics Cards (5 Cards)
- **Total Students**: Count across all classes
- **Overall Average**: School-wide academic performance
- **Attendance Rate**: Average attendance percentage
- **Total Classes**: Number of active classes
- **Exam Results**: Total exam submissions

#### Visualizations

1. **Grade Distribution Pie Chart**
   - Shows distribution of A, B, C, S, W grades
   - Color-coded: Green (A), Blue (B), Yellow (C), Orange (S), Red (W)
   - Interactive with percentages

2. **Student Risk Levels Pie Chart**
   - High Risk (< 35%): Red
   - Medium Risk (35-50%): Yellow
   - Low Risk (> 50%): Green
   - Shows student count per risk level

3. **6-Month Performance Trend (Area Chart)**
   - Displays monthly average performance
   - Purple gradient area chart
   - Shows improvement/decline over time

4. **Class Comparison Bar Chart**
   - Compares all classes side-by-side
   - Purple bars: Average marks
   - Green bars: Attendance rate
   - Interactive tooltips

5. **Class Details Table**
   - Comprehensive table with columns:
     - Class name and grade
     - Total students
     - Average marks (color-coded)
     - Attendance rate (color-coded)
     - High/Medium/Low risk counts
     - View Details action button

#### Class Detail Modal
Clicking "View Details" on any class shows:
- Summary cards (Students, Avg Marks, Attendance, Exam Results)
- Grade distribution breakdown
- Risk level analysis with visual indicators
- Color-coded statistics

### 3. Design Features

#### Glass Morphism Design
- Transparent backgrounds: `bg-white/40` to `bg-white/60`
- Backdrop blur: `backdrop-blur-xl`
- Soft gradient overlays: Indigo/Purple/Pink at 20-30% opacity
- Rounded corners: `rounded-2xl` to `rounded-3xl`
- Subtle borders: `border-2 border-{color}-200/50`

#### Eye-Friendly Colors
- Soft pastels for backgrounds
- Dark text on light backgrounds for readability
- Status-based color coding:
  - Excellent (≥75%): Green
  - Good (50-74%): Blue
  - Warning (35-49%): Yellow
  - Critical (<35%): Red

#### Professional Typography
- Gradient text for headers
- Bold values with light labels
- Consistent font sizes and weights

### 4. Menu Integration
Added "School Analytics" link in:
- **Menu.tsx**: ANALYTICS section (admin only)
- **MenuCompact.tsx**: New ANALYTICS section (admin only)

## Color Palette

### Grade Colors
- Grade A: `#10b981` (Green)
- Grade B: `#3b82f6` (Blue)
- Grade C: `#f59e0b` (Yellow)
- Grade S: `#f97316` (Orange)
- Grade W: `#ef4444` (Red)

### Risk Colors
- High Risk: `#ef4444` (Red)
- Medium Risk: `#f59e0b` (Yellow)
- Low Risk: `#10b981` (Green)

### Primary Theme
- Indigo: Headers and primary actions
- Purple: Secondary elements
- Pink: Accent colors

## Data Calculations

### Risk Level Determination
- **High Risk**: Average < 35%
- **Medium Risk**: Average 35-50%
- **Low Risk**: Average > 50%

### Performance Metrics
- Overall Average: Total marks / Total max marks × 100
- Attendance Rate: Present records / Total attendance records × 100
- Class Average: Per-class marks / Per-class max marks × 100

## Responsive Design
- Grid layouts adapt to screen size
- Mobile-friendly cards and tables
- Responsive charts with ResponsiveContainer
- Modal scrolls on small screens

## Technical Stack
- **Framework**: Next.js 14 (App Router)
- **Charts**: Recharts (PieChart, BarChart, AreaChart)
- **Database**: Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: next-auth with role-based access

## Access Control
- **Role**: Admin only
- **Authentication**: Required (getCurrentUser)
- **Authorization**: Checks role === 'admin'

## Files Created/Modified

### New Files
1. `/src/app/api/admin/analytics-overview/route.ts` - API endpoint
2. `/src/app/(dashboard)/admin/analytics/page.tsx` - Dashboard page

### Modified Files
1. `/src/components/Menu.tsx` - Added School Analytics link
2. `/src/components/MenuCompact.tsx` - Added Analytics section

## Usage
1. Login as admin
2. Navigate to "School Analytics" from sidebar menu
3. View overall statistics in top cards
4. Analyze charts for grade distribution and risk levels
5. Review 6-month performance trend
6. Compare classes in bar chart
7. Click "View Details" on any class for detailed breakdown
8. Use the modal to see class-specific analytics

## Future Enhancements (Optional)
- Export data to PDF/Excel
- Date range filters
- Subject-wise breakdown
- Teacher performance analytics
- Predictive analytics
- Email alerts for high-risk students
- Custom report generation
- Dashboard customization options
