declare global {
  interface Window {
    quick?: any;
  }
}

export const isQuickPlatform = (): boolean => {
  return typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('.quick.shopify.io') || 
     window.location.hostname === 'localhost');
};

let loadPromise: Promise<any | null> | null = null;

function loadQuickClient(timeoutMs = 4000): Promise<any | null> {
  if (window.quick) return Promise.resolve(window.quick);
  if (!isQuickPlatform()) return Promise.resolve(null);

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log('Quick client load timed out');
      resolve(null);
    }, timeoutMs);

    const script = document.createElement('script');
    script.src = '/client/quick.js';
    script.onload = () => {
      const poll = setInterval(() => {
        if (window.quick) {
          clearTimeout(timer);
          clearInterval(poll);
          resolve(window.quick);
        }
      }, 50);
      setTimeout(() => clearInterval(poll), timeoutMs);
    };
    script.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const getQuickClient = async () => {
  return loadQuickClient();
};

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
