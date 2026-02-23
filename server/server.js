const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

// Disable SSL verification for Shopify proxy (internal use only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
console.log('🔓 SSL verification disabled for Shopify proxy');

// Initialize OpenAI client with Shopify Proxy (only if key is available)
let openai = null;
if (process.env.SHOPIFY_AI_KEY) {
  openai = new OpenAI({
    apiKey: process.env.SHOPIFY_AI_KEY,
    baseURL: 'https://proxy.shopify.ai/v1',
  });
  console.log('✅ OpenAI client initialized');
} else {
  console.log('⚠️  No SHOPIFY_AI_KEY found - AI image generation disabled');
}

// Middleware
app.use(cors());
app.use(express.json());

// Image cache to avoid regenerating the same images
const imageCache = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Clear cache endpoint
app.post('/clear-cache', (req, res) => {
  const keysCleared = imageCache.size;
  imageCache.clear();
  console.log(`🗑️ Cleared ${keysCleared} cached images`);
  res.json({ success: true, message: `Cleared ${keysCleared} cached images` });
});

// Generate meal image endpoint using DALL-E 3 via Shopify proxy
app.post('/api/generate-image', async (req, res) => {
  try {
    const { mealName } = req.body;
    
    if (!mealName) {
      return res.status(400).json({ error: 'Meal name is required' });
    }

    // Check if OpenAI is available
    if (!openai) {
      return res.status(503).json({ error: 'AI image generation not available - no API key configured' });
    }

    // Check cache first
    const cacheKey = mealName.toLowerCase().trim();
    if (imageCache.has(cacheKey)) {
      console.log(`✅ Returning cached image for: ${mealName}`);
      return res.json({ 
        imageUrl: imageCache.get(cacheKey),
        cached: true 
      });
    }

    console.log(`🎨 Generating AI image for: ${mealName}`);

    // Use DALL-E 3 via Shopify proxy
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A real photograph of ${mealName} dinner, casual home setting. iPhone photo, slightly imperfect lighting, everyday dinner table. Not a professional food photo - just a normal picture someone would take of their dinner before eating. Natural, unedited, authentic.`,
      n: 1,
      size: "1024x1024",
    });

    // Handle both URL and base64 response formats
    let imageUrl = response.data[0]?.url;
    
    // If no URL, check for base64 data
    if (!imageUrl && response.data[0]?.b64_json) {
      console.log('📸 Received base64 image, converting to data URL');
      imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
    }
    
    if (!imageUrl) {
      console.log('Response:', JSON.stringify(response, null, 2).substring(0, 500));
      throw new Error('No image URL or base64 data in response');
    }

    console.log(`✅ Successfully generated image for: ${mealName}`);
    
    // Cache the result
    imageCache.set(cacheKey, imageUrl);

    res.json({ 
      imageUrl,
      cached: false 
    });

  } catch (error) {
    console.error('❌ Error generating image:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    });
  }
});

// Get all cached images (for debugging)
app.get('/api/cache', (req, res) => {
  res.json({ 
    cacheSize: imageCache.size,
    meals: Array.from(imageCache.keys())
  });
});

// Extract image from a recipe URL
app.post('/api/extract-image', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🔗 Extracting image from: ${url}`);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Try to find og:image first (most reliable for recipe sites)
    let imageUrl = null;
    
    // Look for og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1];
    }
    
    // Try twitter:image if no og:image
    if (!imageUrl) {
      const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twitterMatch) {
        imageUrl = twitterMatch[1];
      }
    }
    
    // Try JSON-LD schema for recipes
    if (!imageUrl) {
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
          try {
            const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
            const data = JSON.parse(jsonContent);
            // Handle array of schemas
            const schemas = Array.isArray(data) ? data : [data];
            for (const schema of schemas) {
              if (schema['@type'] === 'Recipe' && schema.image) {
                imageUrl = Array.isArray(schema.image) ? schema.image[0] : 
                          (typeof schema.image === 'object' ? schema.image.url : schema.image);
                break;
              }
            }
          } catch (e) {
            // Continue if JSON parsing fails
          }
        }
      }
    }

    if (!imageUrl) {
      return res.status(404).json({ error: 'No image found on page' });
    }

    // Make sure it's an absolute URL
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    } else if (imageUrl.startsWith('/')) {
      const urlObj = new URL(url);
      imageUrl = urlObj.origin + imageUrl;
    }

    console.log(`✅ Found image: ${imageUrl}`);
    res.json({ imageUrl });

  } catch (error) {
    console.error('❌ Error extracting image:', error.message);
    res.status(500).json({ 
      error: 'Failed to extract image',
      message: error.message 
    });
  }
});

// Import full recipe data from a URL
app.post('/api/import-recipe', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`📥 Importing recipe from: ${url}`);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    let recipe = {
      name: '',
      description: '',
      ingredients: [],
      instructions: '',
      imageUrl: '',
      prepTime: 0,
      cookTime: 0,
      totalTime: 0,
      servings: '',
      tags: []
    };
    
    // Try to extract from JSON-LD schema first (most structured data)
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
          const data = JSON.parse(jsonContent);
          
          // Handle @graph structure (common in WordPress sites)
          let schemas = [];
          if (data['@graph']) {
            schemas = data['@graph'];
          } else if (Array.isArray(data)) {
            schemas = data;
          } else {
            schemas = [data];
          }
          
          for (const schema of schemas) {
            // Handle @type as string or array
            const schemaType = schema['@type'];
            const isRecipe = schemaType === 'Recipe' || 
                            (Array.isArray(schemaType) && schemaType.includes('Recipe'));
            
            if (isRecipe) {
              console.log('Found Recipe schema:', JSON.stringify(schema, null, 2).slice(0, 500));
              // Name
              if (schema.name) {
                recipe.name = schema.name;
              }
              
              // Description
              if (schema.description) {
                recipe.description = schema.description;
              }
              
              // Image
              if (schema.image) {
                if (Array.isArray(schema.image)) {
                  recipe.imageUrl = typeof schema.image[0] === 'object' ? schema.image[0].url : schema.image[0];
                } else if (typeof schema.image === 'object') {
                  recipe.imageUrl = schema.image.url;
                } else {
                  recipe.imageUrl = schema.image;
                }
              }
              
              // Ingredients
              if (schema.recipeIngredient) {
                recipe.ingredients = schema.recipeIngredient;
              }
              
              // Instructions
              if (schema.recipeInstructions) {
                if (Array.isArray(schema.recipeInstructions)) {
                  recipe.instructions = schema.recipeInstructions
                    .map((inst, idx) => {
                      if (typeof inst === 'string') {
                        return `${idx + 1}. ${inst}`;
                      } else if (inst.text) {
                        return `${idx + 1}. ${inst.text}`;
                      } else if (inst.itemListElement) {
                        // Handle nested HowToSection
                        return inst.itemListElement
                          .map((item, i) => `${i + 1}. ${item.text || item}`)
                          .join('\n');
                      }
                      return '';
                    })
                    .filter(Boolean)
                    .join('\n\n');
                } else {
                  recipe.instructions = schema.recipeInstructions;
                }
              }
              
              // Times (parse ISO 8601 duration)
              const parseDuration = (duration) => {
                if (!duration) return 0;
                const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
                if (match) {
                  const hours = parseInt(match[1] || 0);
                  const minutes = parseInt(match[2] || 0);
                  return hours * 60 + minutes;
                }
                return 0;
              };
              
              recipe.prepTime = parseDuration(schema.prepTime);
              recipe.cookTime = parseDuration(schema.cookTime);
              recipe.totalTime = parseDuration(schema.totalTime) || (recipe.prepTime + recipe.cookTime);
              
              // Servings
              if (schema.recipeYield) {
                recipe.servings = Array.isArray(schema.recipeYield) 
                  ? schema.recipeYield[0] 
                  : schema.recipeYield;
              }
              
              // Tags/categories
              if (schema.recipeCategory) {
                const categories = Array.isArray(schema.recipeCategory) 
                  ? schema.recipeCategory 
                  : [schema.recipeCategory];
                recipe.tags.push(...categories);
              }
              if (schema.recipeCuisine) {
                const cuisines = Array.isArray(schema.recipeCuisine) 
                  ? schema.recipeCuisine 
                  : [schema.recipeCuisine];
                recipe.tags.push(...cuisines);
              }
              if (schema.keywords) {
                const keywords = typeof schema.keywords === 'string'
                  ? schema.keywords.split(',').map(k => k.trim())
                  : schema.keywords;
                recipe.tags.push(...keywords.slice(0, 5)); // Limit keywords
              }
              
              break; // Found recipe, stop searching
            }
          }
        } catch (e) {
          console.log('JSON-LD parse error:', e.message);
          // Continue to next match
        }
      }
    }
    
    // Fallback: try og:image if no image found
    if (!recipe.imageUrl) {
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (ogImageMatch) {
        recipe.imageUrl = ogImageMatch[1];
      }
    }
    
    // Fallback: try og:title if no name found
    if (!recipe.name) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      if (ogTitleMatch) {
        recipe.name = ogTitleMatch[1];
      }
    }
    
    // Fallback: try page title
    if (!recipe.name) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        recipe.name = titleMatch[1].split('|')[0].split('-')[0].trim();
      }
    }
    
    // Fallback: og:description
    if (!recipe.description) {
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
      if (ogDescMatch) {
        recipe.description = ogDescMatch[1];
      }
    }
    
    // Make image URL absolute
    if (recipe.imageUrl) {
      if (recipe.imageUrl.startsWith('//')) {
        recipe.imageUrl = 'https:' + recipe.imageUrl;
      } else if (recipe.imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        recipe.imageUrl = urlObj.origin + recipe.imageUrl;
      }
    }
    
    // Clean up tags - remove duplicates and empty
    recipe.tags = [...new Set(recipe.tags.filter(t => t && t.trim()))].slice(0, 10);
    
    console.log(`✅ Imported recipe: ${recipe.name}`);
    console.log(`   - ${recipe.ingredients.length} ingredients`);
    console.log(`   - ${recipe.instructions ? 'Has instructions' : 'No instructions'}`);
    console.log(`   - ${recipe.imageUrl ? 'Has image' : 'No image'}`);
    
    res.json({ recipe, sourceUrl: url });

  } catch (error) {
    console.error('❌ Error importing recipe:', error.message);
    res.status(500).json({ 
      error: 'Failed to import recipe',
      message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🎨 Using DALL-E 3 via Shopify proxy`);
  if (!process.env.SHOPIFY_AI_KEY) {
    console.log(`⚠️  Warning: SHOPIFY_AI_KEY not set in .env file`);
  }
});
