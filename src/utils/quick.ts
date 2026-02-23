// Quick platform client for Shopify internal hosting
// These APIs are only available when deployed to quick.shopify.io

// Check if running on Quick platform
export const isQuickPlatform = (): boolean => {
  return typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('.quick.shopify.io') || 
     window.location.hostname === 'localhost');
};

// Lazy load Quick client only when on the platform
let quickClient: any = null;

export const getQuickClient = async () => {
  if (quickClient) return quickClient;
  
  try {
    // Use indirect eval import so Vite doesn't try to resolve this at build time.
    // This path only exists on the Quick hosting platform.
    const importPath = '/client/quick.js';
    quickClient = await (new Function('p', 'return import(p)'))(importPath);
    return quickClient;
  } catch (e) {
    console.log('Quick client not available - running locally without Quick APIs');
    return null;
  }
};

// Convenience functions
export const getQuickDB = async () => {
  const quick = await getQuickClient();
  return quick?.db || null;
};

export const getQuickAI = async () => {
  const quick = await getQuickClient();
  return quick?.ai || null;
};

export const getQuickFS = async () => {
  const quick = await getQuickClient();
  return quick?.fs || null;
};

export const getQuickID = async () => {
  const quick = await getQuickClient();
  return quick?.id || null;
};
