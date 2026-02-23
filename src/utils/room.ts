const STORAGE_KEY = 'dinner-app-family-room';

export function generateRoomId(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function getRoomFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('family');
}

export function getSavedRoom(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveRoom(roomId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, roomId);
  } catch {
    // localStorage unavailable
  }
}

export function clearSavedRoom(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function resolveRoom(): string | null {
  const fromUrl = getRoomFromUrl();
  if (fromUrl) {
    saveRoom(fromUrl);
    return fromUrl;
  }
  return getSavedRoom();
}

export function setRoomInUrl(roomId: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set('family', roomId);
  window.history.replaceState({}, '', url.toString());
}
