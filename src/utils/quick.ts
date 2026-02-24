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

function waitForQuick(timeoutMs = 3000): Promise<any | null> {
  if (window.quick) return Promise.resolve(window.quick);
  if (!isQuickPlatform()) return Promise.resolve(null);

  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (window.quick) return resolve(window.quick);
      if (Date.now() - start > timeoutMs) return resolve(null);
      requestAnimationFrame(check);
    };
    check();
  });
}

export const getQuickClient = async () => {
  return waitForQuick();
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
