# Multiple Duration Meal Planning Feature

## Overview
The meal planning feature now supports generating plans for different durations: single or multiple weeks, and single or multiple months.

## What's New

### 1. **Flexible Duration Selection**
- **Week-based planning**: Generate plans for 1-4 weeks
- **Month-based planning**: Generate plans for 1-3 months
- Easily switch between week and month modes

### 2. **Duration Preferences Page**
Located in **Preferences** (formerly "Plan Week"):
- **Duration Type Selector**: Choose between Week(s) or Month(s)
- **Duration Count Slider**: Select how many weeks (1-4) or months (1-3)
- **Dynamic Day Calculations**: Total days automatically calculated
- **Scaled Controls**: Eating out and leftover day sliders adjust to plan length

### 3. **Plan View Page**
The **Plan** page (formerly "This Week") now includes:
- **Dynamic Title**: Shows plan duration (e.g., "3 Weeks Plan" or "2 Months Plan")
- **Week Navigation**: For plans longer than 7 days, navigate between weeks
- **Previous/Next Week Buttons**: Easily browse through your extended plan
- **Week Counter**: Shows which week you're viewing (e.g., "Week 2 of 4")

### 4. **Edit Plan Page**
Enhanced editing for longer plans:
- **Week-by-Week Editing**: Navigate through weeks for longer plans
- **Dynamic Header**: Shows plan duration type
- **Same Navigation Controls**: Previous/Next week buttons for easy editing

## How to Use

### Creating a New Plan
1. Go to **Preferences** (gear icon in bottom nav)
2. Select duration type: **Week(s)** or **Month(s)**
3. Choose how many (1-4 weeks or 1-3 months)
4. Adjust eating out and leftover days as needed
5. Click **Generate [X] Week(s)/Month(s)** button

### Viewing Your Plan
1. Go to **Plan** (calendar icon in bottom nav)
2. View current week of your plan
3. For longer plans:
   - Use **Previous Week** / **Next Week** buttons to navigate
   - See week number and date range at the top

### Editing Your Plan
1. From the Plan view, click **Edit**
2. For longer plans, navigate between weeks
3. Edit meals, types (meal/eating out/leftovers) for each day
4. Click **Save Changes** when done

## Examples

### 1 Week Plan (Default)
- 7 days
- Sunday to Saturday
- No week navigation needed

### 2 Weeks Plan
- 14 days
- Navigate between Week 1 and Week 2
- Continuous meal planning for two weeks

### 1 Month Plan
- ~30 days
- Navigate through 4-5 weeks
- Perfect for monthly meal prep planning

### 3 Months Plan
- ~90 days
- Navigate through 12-13 weeks
- Ideal for seasonal planning or bulk meal prep

## Technical Details

### Data Model Updates
- **WeeklyPlan interface** now includes:
  - `duration`: 'week' | 'month'
  - `durationCount`: number (1-4 for weeks, 1-3 for months)
- **PlannerPreferences interface** includes duration settings
- **Backward compatible**: Old plans automatically default to 1 week

### Plan Generation
- Dynamically calculates total days based on duration
- Scales eating out and leftover day logic proportionally
- Maintains all existing meal selection and randomization logic

### UI/UX Enhancements
- Week pagination for longer plans
- Clear visual indicators of current week
- Date ranges displayed for context
- Responsive controls that adapt to plan length

## Benefits

1. **Flexibility**: Plan for any timeframe that suits your needs
2. **Bulk Planning**: Generate meal plans for months at a time
3. **Reduced Planning Overhead**: Set and forget for longer periods
4. **Better Organization**: Navigate easily through extended plans
5. **Same Great Features**: All existing features work with any duration

## Notes

- Plans longer than 7 days show week-by-week views for easier navigation
- Each week view shows 7 days (Sunday-Saturday)
- The last partial week will show remaining days only
- All meal rotation, eating out, and leftover rules scale automatically
- Edit and regenerate options work for any duration

Enjoy planning your meals for weeks or months at a time! 🎉
