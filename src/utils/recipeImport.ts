// Recipe import utility - extract meal data from recipe URLs using AI

import { Meal, MealIngredient } from '../types';
import { generateId, extractTagsFromName } from './storage';

/** Check if a string looks like a URL */
export function isUrl(text: string): boolean {
  const trimmed = text.trim();
  // Match common URL patterns
  return /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed);
}

/** Normalize a URL (add https:// if missing) */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/** Strip HTML tags and extract readable text content */
function extractTextFromHtml(html: string): string {
  // Remove script and style blocks entirely
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '');

  // Replace common block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|hr)[^>]*>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#\d+;/g, '');

  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n');
  text = text.trim();

  return text;
}

/** Try to extract JSON-LD structured recipe data from HTML */
function extractJsonLdRecipe(html: string): any | null {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      // Handle @graph arrays
      if (data['@graph']) {
        const recipe = data['@graph'].find(
          (item: any) => item['@type'] === 'Recipe'
        );
        if (recipe) return recipe;
      }

      // Direct recipe type
      if (data['@type'] === 'Recipe') return data;

      // Array of types
      if (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))
        return data;

      // Array of objects
      if (Array.isArray(data)) {
        const recipe = data.find(
          (item: any) =>
            item['@type'] === 'Recipe' ||
            (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
        if (recipe) return recipe;
      }
    } catch {
      // Invalid JSON, continue to next match
    }
  }

  return null;
}

/** Build a Meal from structured JSON-LD recipe data */
function mealFromJsonLd(jsonLd: any, url: string): Meal {
  const name = jsonLd.name || 'Imported Recipe';

  // Parse ingredients
  const ingredients: MealIngredient[] = (
    jsonLd.recipeIngredient || []
  ).map((ing: string) => ({
    name: ing,
    quantity: '',
    optional: false,
  }));

  // Parse instructions
  let recipe = '';
  if (typeof jsonLd.recipeInstructions === 'string') {
    recipe = jsonLd.recipeInstructions;
  } else if (Array.isArray(jsonLd.recipeInstructions)) {
    recipe = jsonLd.recipeInstructions
      .map((step: any, i: number) => {
        if (typeof step === 'string') return `${i + 1}. ${step}`;
        if (step.text) return `${i + 1}. ${step.text}`;
        return null;
      })
      .filter(Boolean)
      .join('\n');
  }

  // Parse prep time from ISO 8601 duration (e.g. PT30M)
  let prepTime = 0;
  const totalTime = jsonLd.totalTime || jsonLd.prepTime || jsonLd.cookTime || '';
  const timeMatch = totalTime.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (timeMatch) {
    prepTime = (parseInt(timeMatch[1] || '0') * 60) + parseInt(timeMatch[2] || '0');
  }

  // Image
  let imageUrl = '';
  if (jsonLd.image) {
    if (typeof jsonLd.image === 'string') {
      imageUrl = jsonLd.image;
    } else if (Array.isArray(jsonLd.image)) {
      imageUrl = typeof jsonLd.image[0] === 'string' ? jsonLd.image[0] : jsonLd.image[0]?.url || '';
    } else if (jsonLd.image.url) {
      imageUrl = jsonLd.image.url;
    }
  }

  const description = jsonLd.description || '';
  const tags = extractTagsFromName(name);

  return {
    id: generateId(),
    name,
    description,
    ingredients,
    recipe,
    links: [url],
    tags,
    prepTime,
    imageUrl,
    notes: '',
    createdAt: new Date().toISOString(),
    lastMadeAt: null,
  };
}

/** Try a single fetch with a timeout */
async function fetchWithTimeout(
  fetchUrl: string,
  opts: RequestInit = {},
  timeoutMs = 10000
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(fetchUrl, {
      ...opts,
      signal: controller.signal,
    });
    if (response.ok) {
      return await response.text();
    }
  } catch {
    // fetch failed
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/** Fetch page content, trying multiple CORS proxies as fallbacks */
async function fetchPageContent(url: string): Promise<string | null> {
  // 1. Try direct fetch (works for some sites or same-origin)
  const direct = await fetchWithTimeout(url, { headers: { Accept: 'text/html' } }, 8000);
  if (direct && direct.length > 500) return direct;

  // 2. Try multiple CORS proxies in order
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
    (u: string) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`,
  ];

  for (const buildUrl of proxies) {
    const html = await fetchWithTimeout(buildUrl(url), {}, 12000);
    if (html && html.length > 500) return html;
  }

  // 3. Try allorigins JSON endpoint (wraps response, more reliable than raw)
  try {
    const aoJson = await fetchWithTimeout(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      {},
      12000
    );
    if (aoJson) {
      const parsed = JSON.parse(aoJson);
      if (parsed.contents && parsed.contents.length > 500) return parsed.contents;
    }
  } catch { /* continue */ }

  return null;
}

interface AiRecipeData {
  name: string;
  description: string;
  ingredients: { name: string; quantity: string; optional: boolean }[];
  recipe: string;
  prepTime: number;
  tags: string[];
}

/** Use AI to extract recipe data from page text */
async function extractRecipeWithAi(
  pageText: string,
  url: string
): Promise<AiRecipeData | null> {
  // Truncate page text to avoid token limits
  const truncated = pageText.slice(0, 8000);

  const systemPrompt = `You are a recipe data extractor. Given text from a recipe webpage, extract the recipe data into a structured JSON format. Return ONLY valid JSON, no other text.

The JSON should have these fields:
- name: string (the recipe title)
- description: string (a brief 1-2 sentence description)
- ingredients: array of objects with {name: string, quantity: string, optional: boolean}
- recipe: string (step-by-step instructions, numbered)
- prepTime: number (total time in minutes, estimate if not clear)
- tags: array of strings (cuisine type, protein, dietary info like "vegetarian", etc.)

If you cannot find recipe data, return {"error": "no recipe found"}.`;

  try {
    const response = await fetch('/api/ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Extract recipe data from this webpage (${url}):\n\n${truncated}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (parsed.error) return null;

    return parsed as AiRecipeData;
  } catch {
    return null;
  }
}

/** Use AI with just the URL (fallback when page fetch fails) */
async function extractRecipeFromUrlOnly(url: string): Promise<AiRecipeData | null> {
  const systemPrompt = `You are a recipe data extractor. The user will give you a URL to a recipe page. Based on the URL and your knowledge, try to identify the recipe and extract data into structured JSON. Return ONLY valid JSON, no other text.

The JSON should have these fields:
- name: string (the recipe title)
- description: string (a brief 1-2 sentence description)
- ingredients: array of objects with {name: string, quantity: string, optional: boolean}
- recipe: string (step-by-step instructions, numbered)
- prepTime: number (total time in minutes, estimate if not clear)
- tags: array of strings (cuisine type, protein, dietary info like "vegetarian", etc.)

If you cannot identify the recipe from the URL, return {"error": "cannot identify recipe"}.`;

  try {
    const response = await fetch('/api/ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Extract recipe data from this URL: ${url}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (parsed.error) return null;

    return parsed as AiRecipeData;
  } catch {
    return null;
  }
}

/** Convert AI recipe data to a Meal object */
function mealFromAiData(aiData: AiRecipeData, url: string, imageUrl: string = ''): Meal {
  return {
    id: generateId(),
    name: aiData.name,
    description: aiData.description || '',
    ingredients: aiData.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity || '',
      optional: ing.optional || false,
    })),
    recipe: aiData.recipe || '',
    links: [url],
    tags: aiData.tags || extractTagsFromName(aiData.name),
    prepTime: aiData.prepTime || 0,
    imageUrl,
    notes: `Imported from: ${url}`,
    createdAt: new Date().toISOString(),
    lastMadeAt: null,
  };
}

export interface ImportResult {
  success: boolean;
  meal?: Meal;
  error?: string;
}

/** Check if the Quick AI proxy is available */
async function isAiAvailable(): Promise<boolean> {
  try {
    const resp = await fetchWithTimeout('/api/ai', {}, 3000);
    return resp !== null;
  } catch {
    return false;
  }
}

/**
 * Import a recipe from a URL.
 * Tries structured data (JSON-LD) first, then AI extraction, then URL-only AI fallback.
 */
export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  const normalizedUrl = normalizeUrl(url);

  // Step 1: Try to fetch the page
  const html = await fetchPageContent(normalizedUrl);

  if (html) {
    // Step 2a: Try JSON-LD structured data (most recipe sites have this)
    const jsonLd = extractJsonLdRecipe(html);
    if (jsonLd) {
      const meal = mealFromJsonLd(jsonLd, normalizedUrl);
      return { success: true, meal };
    }

    // Step 2b: Use AI to extract from page text (only if AI is available)
    const aiOk = await isAiAvailable();
    if (aiOk) {
      const pageText = extractTextFromHtml(html);
      const aiData = await extractRecipeWithAi(pageText, normalizedUrl);
      if (aiData) {
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        const imageUrl = ogImageMatch?.[1] || '';
        const meal = mealFromAiData(aiData, normalizedUrl, imageUrl);
        return { success: true, meal };
      }
    }

    // Step 2c: We got the page but couldn't parse it structurally or with AI.
    // Try to extract basic info from HTML meta tags as a last resort.
    const fallbackMeal = extractBasicMetaFromHtml(html, normalizedUrl);
    if (fallbackMeal) {
      return { success: true, meal: fallbackMeal };
    }

    return {
      success: false,
      error: aiOk
        ? 'Fetched the page but could not extract recipe data. The site may not have structured recipe data.'
        : 'Fetched the page but could not find structured recipe data. Deploy to Quick for AI-powered extraction.',
    };
  }

  // Step 3: Fallback - ask AI with just the URL (only if AI is available)
  const aiOk = await isAiAvailable();
  if (aiOk) {
    const aiData = await extractRecipeFromUrlOnly(normalizedUrl);
    if (aiData) {
      const meal = mealFromAiData(aiData, normalizedUrl);
      return { success: true, meal };
    }
  }

  return {
    success: false,
    error: 'Could not fetch the recipe page. Check the URL is correct and try again.',
  };
}

/** Extract basic meal info from HTML meta tags when JSON-LD isn't available */
function extractBasicMetaFromHtml(html: string, url: string): Meal | null {
  // Try og:title or <title>
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const name = ogTitle?.[1] || titleTag?.[1] || '';

  if (!name || name.length < 3) return null;

  // Clean up the name (remove site name suffixes like " - RecipeTin Eats")
  const cleanName = name.replace(/\s*[-|–]\s*[^-|–]+$/, '').trim();

  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = ogDesc?.[1] || metaDesc?.[1] || '';

  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const imageUrl = ogImage?.[1] || '';

  const tags = extractTagsFromName(cleanName);

  return {
    id: generateId(),
    name: cleanName,
    description,
    ingredients: [],
    recipe: '',
    links: [url],
    tags,
    prepTime: 0,
    imageUrl,
    notes: `Imported from: ${url}\nNote: Only basic info was extracted. Add ingredients and recipe manually, or re-import on Quick for full AI extraction.`,
    createdAt: new Date().toISOString(),
    lastMadeAt: null,
  };
}
