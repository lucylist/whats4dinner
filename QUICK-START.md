# 🍽️ Dinner Planner App - Quick Start Guide

Your dinner planning app is ready to use! Here's how to get started.

## 🚀 Installation & Setup

1. **Navigate to the app directory:**
```bash
cd /Users/lucylist/Documents/cursor/whats4dinner
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The app will open automatically in your browser at `http://localhost:3000` 🎉

## 📱 App Features Overview

### 1️⃣ **Meals Library** (Home Screen)
- **Add meals** you know how to cook
- Include ingredients, recipes, prep time, tags, and photos
- Search and filter by tags
- Edit or delete meals anytime

### 2️⃣ **This Week** (View Current Plan)
- See your weekly meal schedule
- View recipes for each day
- Quick access to ingredients and instructions
- Shows eating out days and leftovers

### 3️⃣ **Plan Week** (Generate New Plan)
- Set how many eating out days (0-7)
- Set how many leftover days (0-7)
- Choose preferences (quick meals, use fridge ingredients)
- Generate a random weekly plan instantly
- **Edit Mode**: Customize the generated plan
  - Change meals for any day
  - Mark days as eating out or leftovers
  - Lock specific days to prevent changes

### 4️⃣ **My Fridge** (Ingredient Inventory)
- **What I Have Tab:**
  - Add ingredients you currently have
  - Track quantities and expiration dates
  - Organized by category (Produce, Meat, Dairy, etc.)
  - Get alerts for expiring ingredients

- **Recommendations Tab:**
  - Click "What Can I Make?"
  - See meals ranked by match percentage
  - Filter: "Can Make Now" (100%) or "Almost There" (80%+)
  - View missing ingredients for each meal
  - Add recommended meals to your plan

## 💡 Typical Workflow

### First Time Setup:
1. **Add 5-10 meals** to your library (with ingredients)
2. **Stock your fridge** with current ingredients
3. **Generate your first weekly plan**

### Weekly Routine:
1. **Sunday**: Generate new plan for the week
2. **After grocery shopping**: Update fridge inventory
3. **Mid-week**: Check "What Can I Make?" for quick dinner ideas
4. **Daily**: View plan and access recipes

## 🎯 Pro Tips

1. **Tags are your friend**: Use tags like "quick", "healthy", "vegetarian" to organize meals
2. **Track expiration dates**: The app will highlight expiring ingredients
3. **Use recommendations**: Great for using up ingredients before they expire
4. **Quick add mode**: Just enter ingredient name for faster entry
5. **Lock days**: Planning a special meal? Lock that day so it doesn't change

## 🔧 Technical Details

- **Built with**: React, TypeScript, Tailwind CSS
- **Data storage**: Local browser storage (stays on your device)
- **No account needed**: Everything works offline
- **Mobile friendly**: Responsive design works on all devices

## 📝 Example Data

Want to test quickly? Here are some example meals to add:

**Quick Chicken Stir Fry**
- Ingredients: Chicken breast, Bell peppers, Onion, Soy sauce, Rice
- Prep time: 25 min
- Tags: quick, healthy, asian

**Spaghetti Bolognese**
- Ingredients: Ground beef, Pasta, Tomato sauce, Onion, Garlic
- Prep time: 40 min
- Tags: italian, comfort

**Tacos**
- Ingredients: Ground beef, Tortillas, Lettuce, Cheese, Tomatoes, Salsa
- Prep time: 20 min
- Tags: mexican, quick, fun

## 🐛 Troubleshooting

**App won't start?**
- Make sure you ran `npm install` first
- Check that port 3000 isn't already in use

**Lost your data?**
- Data is stored in browser localStorage
- Clearing browser data will erase your meals/plans
- Consider exporting data periodically

**Recommendations not working?**
- Make sure you've added ingredients to both meals AND fridge
- The matching is fuzzy but ingredient names should be similar

## 📦 Building for Production

When ready to deploy:

```bash
npm run build
```

The optimized app will be in the `dist` folder, ready to deploy to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

---

## 🎉 You're All Set!

Open your browser to `http://localhost:3000` and start planning your dinners!

Happy cooking! 👨‍🍳👩‍🍳
