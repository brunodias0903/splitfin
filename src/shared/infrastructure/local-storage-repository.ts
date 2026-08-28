export interface Repository<T> {
  load(): T[];
  save(items: T[]): void;
}

export function createLocalStorageRepository<T>(
  key: string,
  isValid: (data: unknown) => data is T,
): Repository<T> {
  return {
    load() {
      if (typeof window === "undefined") return [];
      try {
        const saved = window.localStorage.getItem(key);
        if (!saved) return [];
        const parsed: unknown = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(isValid) : [];
      } catch {
        return [];
      }
    },
    save(items) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(items));
      }
    },
  };
}
