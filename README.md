# Dinner Planner App

A modern web application for planning weekly meals, managing your meal library, and getting smart meal recommendations based on ingredients you have available.

## Features

### ✨ Core Features
- **Meal Library**: Add, edit, and manage all your favorite meals with details like ingredients, recipes, prep time, tags, and images
- **Weekly Planner**: Generate random weekly meal plans with customizable preferences
- **Plan Customization**: Edit and rearrange your weekly plan with drag-and-drop functionality
- **Eating Out & Leftovers**: Built-in support for eating out days and leftover meals

### 🥗 Ingredient Intelligence
- **Ingredient Inventory**: Track what's in your fridge and pantry
- **Expiration Tracking**: Get alerts for ingredients expiring soon
- **Smart Recommendations**: Get meal suggestions based on available ingredients
- **Match Scoring**: See how well you can make each meal with what you have

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **date-fns** - Date utilities
- **Fuse.js** - Fuzzy search for ingredient matching
- **Lucide React** - Icons
- **Local Storage** - Data persistence

## How to Use

### 1. Add Your Meals
- Click "Add Meal" to create entries for meals you know how to make
- Include ingredients, recipe steps, prep time, tags, and links
- Add photos to make your library more visual

### 2. Stock Your Fridge
- Navigate to "My Fridge"
- Add ingredients you currently have
- Optionally track quantities and expiration dates

### 3. Get Recommendations
- Click "What Can I Make?" to see meals you can prepare
- Filter by "Can Make Now" (100% match) or "Almost There" (80%+ match)
- See exactly which ingredients you're missing

### 4. Plan Your Week
- Go to "Plan" and set your preferences
- Choose how many eating out days and leftover days
- Generate a random weekly plan
- Customize as needed

### 5. Follow Your Plan
- View "This Week" to see your daily meals
- Access recipes with one click
- Check off days as you go

## Data Storage

All data is stored locally in your browser's localStorage. Your data stays private and never leaves your device. To backup your data, you can export it from the browser's developer tools.

## Future Enhancements

- Shopping list generation
- Meal history and analytics
- Recipe import from URLs
- Cloud sync across devices
- Mobile app versions
- Barcode scanning
- Nutritional information
- Meal sharing with friends

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT License - feel free to use and modify as needed.

---

Built with ❤️ for home cooks everywhere
