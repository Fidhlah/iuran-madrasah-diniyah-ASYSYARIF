const CACHE_KEY = "swr-cache"
const CACHE_TTL = 60 * 60 * 500

type CacheEntry = [string, { value: any; timestamp: number }]

export function localStorageProvider(): Map<string, any> {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return new Map<string, any>()
  }

  // Ambil cache dari localStorage, filter yang belum expired
  const now = Date.now()
  let raw: CacheEntry[] = []
  try {
    raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]")
  } catch {
    raw = []
  }
  const validEntries = raw.filter(
    ([, entry]) => entry && typeof entry.timestamp === "number" && now - entry.timestamp < CACHE_TTL
  )
  // Jika ada entry expired, update localStorage
  if (validEntries.length !== raw.length) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(validEntries))
  }

  // Map hanya value-nya saja
  const map = new Map<string, any>(
    validEntries.map(([key, entry]) => [key, entry.value])
  )

  // Patch set method
  const set = map.set
  map.set = function (key: string, value: any) {
    const result = set.call(this, key, value)
    // Simpan value + timestamp
    const entries: CacheEntry[] = Array.from(map.entries()).map(([k, v]) => [
      k,
      { value: v, timestamp: Date.now() },
    ])
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries))
    return result
  }

  // Patch delete method
  const del = map.delete
  map.delete = function (key: string) {
    const result = del.call(this, key)
    const entries: CacheEntry[] = Array.from(map.entries()).map(([k, v]) => [
      k,
      { value: v, timestamp: Date.now() },
    ])
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries))
    return result
  }

  return map
}