const store: Record<string, string> = {};
export const getItemAsync = async (key: string) => store[key] ?? null;
export const setItemAsync = async (key: string, value: string) => { store[key] = value; };
export const deleteItemAsync = async (key: string) => { delete store[key]; };
