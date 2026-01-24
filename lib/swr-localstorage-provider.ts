export function localStorageProvider(): Map<string, any> {
  // Cek apakah berjalan di browser
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return new Map<string, any>()
  }

  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem('swr-cache') || '[]')
  )

  // Patch set method agar setiap update langsung simpan ke localStorage
  const set = map.set
  map.set = function (key: string, value: any) {
    const result = set.call(this, key, value)
    localStorage.setItem('swr-cache', JSON.stringify(Array.from(map.entries())))
    return result
  }

  // Patch delete method agar setiap hapus langsung simpan ke localStorage
  const del = map.delete
  map.delete = function (key: string) {
    const result = del.call(this, key)
    localStorage.setItem('swr-cache', JSON.stringify(Array.from(map.entries())))
    return result
  }

  return map
}