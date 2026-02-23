# Dinner App Backend Server

Backend server for AI-powered meal image generation using OpenAI's DALL-E.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3001
```

4. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file

## API Endpoints

### `POST /api/generate-image`
Generate an AI image for a meal.

**Request:**
```json
{
  "mealName": "Chicken Stir Fry"
}
```

**Response:**
```json
{
  "imageUrl": "https://...",
  "cached": false
}
```

### `GET /health`
Check if server is running.

### `GET /api/cache`
See cached images.

## Cost Information

- DALL-E 3: ~$0.04 per image (1024x1024, standard quality)
- Images are cached to avoid regenerating
- First generation is charged, subsequent uses are free (from cache)

## Notes

- Server runs on port 3001 by default
- Frontend must be updated to call this server
- Images are cached in memory (cleared on restart)
