// Web fallback: expo-secure-store has no web implementation.
// Use localStorage as a best-effort substitute in the browser.

export async function getItemAsync(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  localStorage.removeItem(key);
}
