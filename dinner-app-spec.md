# Dinner App Specification

## Overview
A meal planning application that helps users organize their meal repertoire and automatically generate weekly dinner plans with the ability to account for eating out and leftovers.

## Core User Stories

### Meal Management
- As a user, I want to add meals I know how to make so I can build my meal library
- As a user, I want to add details to each meal (ingredients, recipe, links) so I have all the information I need
- As a user, I want to edit or delete meals so I can keep my library up to date
- As a user, I want to search or filter my meals so I can find specific dishes quickly

### Weekly Planning
- As a user, I want to generate a random weekly meal plan so I don't have to decide what to cook each day
- As a user, I want to customize the plan after generation (move, swap, edit meals) so I have flexibility
- As a user, I want to mark certain days as "eating out" so the app doesn't assign meals
- As a user, I want to mark certain days as "leftovers" so I can reuse previous meals

### Ingredient-Based Recommendations
- As a user, I want to add ingredients I have in my fridge so I can track what's available
- As a user, I want to see meal recommendations based on ingredients I have so I can use what I already own
- As a user, I want to know which additional ingredients I need for recommended meals so I can decide what to make

### Convenience Features
- As a user, I want to see which ingredients I need for the week so I can make a shopping list
- As a user, I want to save successful weekly plans so I can reuse them later

## Features Breakdown

### 1. Meal Library
**Functions:**
- Add new meal
- Edit existing meal
- Delete meal
- View all meals (list/grid view)
- Search meals by name
- Filter meals by tags/categories

**Meal Properties:**
- Name (required)
- Description (optional)
- Ingredients list (optional)
- Recipe/Instructions (optional)
- External links (recipe websites, videos, etc.)
- Tags/Categories (e.g., "quick", "vegetarian", "spicy")
- Prep time (optional)
- Image (optional)
- Notes (optional)
- Last made date (auto-tracked)

### 2. Weekly Planner
**Functions:**
- Generate random weekly plan
- Specify date range (default: next 7 days)
- Set constraints:
  - Number of "eating out" days
  - Number of "leftover" days
  - Exclude certain meals
  - Prefer certain meal categories
- View weekly calendar with assigned meals

### 3. Plan Customization
**Functions:**
- Drag and drop meals to different days
- Swap two meals
- Replace a meal with another from library
- Add manual entry (e.g., "Pizza Night")
- Mark day as "Eating Out"
- Mark day as "Leftovers" (select from which previous meal)
- Remove meal from a day
- Lock certain days (prevent randomization changes)

### 4. Ingredient Inventory & Recommendations
**Functions:**
- Add ingredients to "My Fridge/Pantry"
- Mark ingredient quantities (optional)
- Remove/use up ingredients
- Set expiration dates (optional)
- View all available ingredients
- Get meal recommendations based on available ingredients
- See "match score" for each meal (% of ingredients you have)
- Filter meals by:
  - "Can make now" (100% ingredients available)
  - "Almost there" (80%+ ingredients available)
  - "Missing just a few" (show what's needed)
- Quick add missing ingredients to shopping list

**Recommendation Algorithm:**
- Match meals where you have most/all ingredients
- Prioritize meals with expiring ingredients
- Show what's missing for "almost there" meals
- Sort by match percentage

### 5. Shopping List (Future Enhancement)
**Functions:**
- Auto-generate shopping list from week's meals
- Combine duplicate ingredients
- Check off items as purchased
- Add ingredients from inventory directly to list

### 6. History & Analytics (Future Enhancement)
**Functions:**
- View past weekly plans
- Track how often each meal is made
- Suggest underutilized meals

## Data Models

### Meal
```
{
  id: string (UUID)
  name: string
  description: string
  ingredients: Ingredient[] | string[]
  recipe: string
  links: string[]
  tags: string[]
  prepTime: number (minutes)
  imageUrl: string
  notes: string
  createdAt: timestamp
  lastMadeAt: timestamp
}
```

### Ingredient (for structured ingredient tracking)
```
{
  name: string
  quantity: string (e.g., "2 cups", "1 lb", "3 cloves")
  optional: boolean
}
```

### Inventory Item
```
{
  id: string (UUID)
  ingredientName: string
  quantity: string
  unit: string
  expirationDate: date | null
  category: string (e.g., "produce", "dairy", "meat", "pantry")
  addedAt: timestamp
  notes: string
}
```

### Weekly Plan
```
{
  id: string (UUID)
  weekStartDate: date
  days: DayPlan[]
  createdAt: timestamp
  modifiedAt: timestamp
}
```

### DayPlan
```
{
  date: date
  mealId: string | null
  type: "meal" | "eating_out" | "leftovers"
  leftoverFromDate: date | null (if type is "leftovers")
  customNote: string
  locked: boolean
}
```

## UI/UX Flow

### Main Navigation
1. **Meals Library** - Manage all meals
2. **This Week** - Current weekly plan
3. **Plan New Week** - Generate new plan
4. **My Fridge** - Ingredient inventory and recommendations
5. **Settings** - App preferences

### Typical User Flow: Weekly Planning
1. User opens app on Sunday
2. Navigates to "Plan New Week"
3. Selects date range (Monday - Sunday)
4. Sets preferences:
   - "Eat out: 1 day"
   - "Leftovers: 1 day"
5. Clicks "Generate Plan"
6. Reviews generated plan
7. Makes adjustments:
   - Swaps Tuesday and Thursday meals
   - Marks Wednesday as "Eating Out"
   - Marks Sunday as leftovers from Friday
8. Saves plan
9. Throughout week, can view meals and access recipes

### Alternate User Flow: Ingredient-Based Cooking
1. User opens app after grocery shopping
2. Navigates to "My Fridge"
3. Quickly adds ingredients they bought:
   - "Chicken breast - 2 lbs"
   - "Bell peppers - 3"
   - "Onions - 2"
   - etc.
4. Clicks "What Can I Make?"
5. Views recommended meals sorted by match score:
   - "Chicken Stir Fry - 100% match ✅"
   - "Chicken Fajitas - 90% match (need: tortillas, lime)"
   - "Grilled Chicken Salad - 85% match (need: lettuce, tomatoes)"
6. Selects "Chicken Stir Fry"
7. Views full recipe
8. (Optional) Adds to today's meal plan
9. After cooking, ingredients are optionally marked as used

### Key Screens

#### 1. Meals Library Screen
- Grid/List view of all meals
- Search bar at top
- Filter buttons (tags)
- "Add Meal" button (prominent)
- Each meal card shows: name, image, tags, last made date

#### 2. Meal Detail Screen
- Full meal information
- Edit button
- Delete button
- "Add to Today" quick action

#### 3. Add/Edit Meal Screen
- Form with all meal properties
- Save/Cancel buttons
- Delete button (edit mode only)

#### 4. Plan New Week Screen
- Date range selector
- Configuration options:
  - Eating out days: [0-7] slider/input
  - Leftover days: [0-7] slider/input
  - Exclude meals: multi-select
- "Generate Plan" button
- Preview of plan (if generated)
- "Save Plan" button

#### 5. Weekly Plan View Screen
- Calendar view (7 days)
- Each day shows:
  - Date
  - Meal name (or "Eating Out" / "Leftovers")
  - Quick actions: swap, remove, change
- "Regenerate" button
- "Edit Plan" button
- Shopping list button (future)

#### 6. Edit Plan Screen
- Drag-and-drop interface
- Each day card can be:
  - Dragged to another day
  - Clicked to show meal picker
  - Marked as eating out/leftovers
  - Locked (pin icon)
- Meal picker sidebar (quick selection from library)
- Save/Cancel buttons

#### 7. My Fridge Screen (Ingredient Inventory)
- Two tabs: "What I Have" and "Recommendations"
- **What I Have Tab:**
  - List/grid of all inventory items
  - Grouped by category (Produce, Dairy, Meat, Pantry, etc.)
  - Each item shows: name, quantity, expiration date (if set)
  - Items expiring soon highlighted in yellow/orange
  - "Add Ingredient" button (prominent)
  - Quick search/filter
  - Swipe to delete or mark as used
- **Recommendations Tab:**
  - "What Can I Make?" button
  - List of meals sorted by match percentage
  - Each meal card shows:
    - Meal name and image
    - Match percentage badge (e.g., "90% match")
    - List of missing ingredients (if any)
    - "View Recipe" button
    - "Add to Plan" quick action

#### 8. Add Ingredient Screen
- Simple form:
  - Ingredient name (required, autocomplete from known ingredients)
  - Quantity (optional)
  - Unit (dropdown: cups, lbs, oz, pieces, etc.)
  - Expiration date (optional date picker)
  - Category (dropdown)
  - Notes (optional)
- "Save" and "Cancel" buttons
- "Quick Add" mode (just name and save)

#### 9. Meal Recommendations Screen (from My Fridge)
- Filter buttons:
  - "Can Make Now" (100% match)
  - "Almost There" (80%+ match)
  - "All Meals"
- Sort options:
  - Best match first
  - Quickest to make
  - Recently added
- Each recommendation shows:
  - Meal name and image
  - Match score with progress bar
  - Available ingredients (green checkmarks)
  - Missing ingredients (red, with "Add to List" button)
  - Prep time
- Click meal to view full recipe
- "Add to Today" or "Add to [Day]" quick actions

## Technical Considerations

### Platform Options
1. **Web App** (recommended for MVP)
   - Accessible from any device
   - No app store approval needed
   - Easier to iterate
   - Technologies: React, Vue, or vanilla JS

2. **Mobile App**
   - Better for on-the-go access
   - Can use React Native, Flutter
   - Requires more setup

3. **Desktop App**
   - Electron-based
   - Offline-first

### Data Storage
1. **Local Storage** (MVP)
   - Simple to implement
   - No backend needed
   - Data stays on device
   - Use localStorage or IndexedDB

2. **Cloud Storage** (Future)
   - Sync across devices
   - Backup
   - Requires backend (Firebase, Supabase, custom)

### Key Technologies (Web App Example)
- **Frontend**: React or Vue.js
- **State Management**: React Context/Redux or Vuex
- **Styling**: Tailwind CSS or Material-UI
- **Drag & Drop**: react-beautiful-dnd or Vue Draggable
- **Date Handling**: date-fns or dayjs
- **Local Storage**: localStorage API or Dexie.js (IndexedDB wrapper)
- **String Matching**: Fuse.js (fuzzy search for ingredient matching)

### Ingredient Matching Algorithm
**Basic Logic:**
```
For each meal:
  1. Get list of required ingredients from meal
  2. For each required ingredient:
     - Check if it exists in user's inventory (fuzzy match)
     - Consider synonyms (e.g., "scallions" = "green onions")
     - Mark as available or missing
  3. Calculate match score:
     - matchScore = (available ingredients / total required ingredients) × 100
     - Optional ingredients don't count against score
  4. Exclude "always available" ingredients (salt, pepper, oil, water)
  5. Sort meals by match score (highest first)
  6. Show "missing ingredients" list for each meal
```

**Match Categories:**
- **100% match**: Can make now (all ingredients available)
- **80-99% match**: Almost there (1-2 ingredients missing)
- **50-79% match**: Missing several items
- **<50% match**: Not feasible (hide or show at bottom)

**Smart Features:**
- Prioritize meals with expiring ingredients (within 3 days)
- Learn from user's ingredient naming conventions
- Suggest common substitutions (e.g., "Can substitute Greek yogurt for sour cream")
- Handle quantity awareness if enabled (e.g., "You have 1 chicken breast, need 2")

## MVP Feature Set (Phase 1)
For initial launch, focus on:
1. ✅ Add/Edit/Delete meals with basic details (name, ingredients, recipe, links)
2. ✅ View meals library
3. ✅ Generate random weekly plan
4. ✅ Manual editing of plan (swap, remove, add)
5. ✅ Mark days as "Eating Out" or "Leftovers"
6. ✅ Save current week's plan

## Phase 1.5 Features (High Priority)
Add ingredient inventory and smart recommendations:
1. ✅ Add/Edit/Delete ingredients in "My Fridge"
2. ✅ View all available ingredients by category
3. ✅ Get meal recommendations based on available ingredients
4. ✅ See match percentage for each meal
5. ✅ View missing ingredients for "almost there" meals
6. ✅ Quick add recommended meal to plan

## Future Enhancements (Phase 2+)
- Shopping list generation with auto-population from weekly plan
- Mark ingredients as "used" after cooking
- Expiration date tracking and notifications
- Ingredient quantity tracking and depletion
- Auto-suggest meals using soon-to-expire ingredients
- Meal history and analytics
- Favorite meals
- Meal ratings
- Recipe import from URLs (auto-extract ingredients)
- Share meals with others
- Dietary restrictions/filters
- Nutritional information
- Barcode scanning for adding ingredients (mobile)
- Voice input for adding ingredients
- Mobile app versions
- Cloud sync

## Design Principles
1. **Simple & Fast** - Minimal clicks to generate a plan
2. **Flexible** - Easy to customize after generation
3. **Visual** - Use images and icons to make meals appealing
4. **Intuitive** - Drag-and-drop for rearranging
5. **Helpful** - Smart defaults and suggestions

## Success Metrics
- User can add 5 meals in under 5 minutes
- User can generate a weekly plan in under 30 seconds
- User can customize a plan in under 2 minutes
- User can add 10 ingredients to their fridge in under 2 minutes
- User gets useful meal recommendations within 5 seconds
- User returns to use the app weekly
- User uses the ingredient recommendation feature at least once per week

## Open Questions
1. Should meals be tagged as breakfast/lunch/dinner or just "dinner"?
2. How to handle leftovers from a meal not in the current week?
3. Should there be meal portion sizes for leftover calculation?
4. Should users be able to share meal libraries?
5. How strict should ingredient matching be? (e.g., does "chicken" match "chicken breast"?)
6. Should the app track ingredient quantities and deplete them after cooking?
7. Should users get notifications for expiring ingredients?
8. How to handle generic ingredients like "salt", "pepper", "oil" (always assumed available)?
9. Should the recommendation algorithm consider prep time or complexity?
10. Should meals with expiring ingredients be prioritized in recommendations?

---

## Next Steps
1. Review and refine this spec
2. Create wireframes/mockups
3. Choose technology stack
4. Set up development environment
5. Build MVP features
6. Test with real users
7. Iterate based on feedback
