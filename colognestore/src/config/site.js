export const siteConfig = {
  name: import.meta.env.VITE_STORE_NAME?.trim() || 'Cologne Store',
  tagline: import.meta.env.VITE_STORE_TAGLINE?.trim() || 'Fragrance, with intention',
}
