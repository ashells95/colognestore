const CART_STORAGE_KEY = 'colognestore-cart-v1'

function isCartItem(value) {
  if (!value || typeof value !== 'object') return false
  if (
    typeof value.key !== 'string'
    || typeof value.productId !== 'string'
    || typeof value.sku !== 'string'
    || typeof value.name !== 'string'
    || typeof value.brand !== 'string'
    || !Number.isSafeInteger(value.sizeMl)
    || typeof value.concentration !== 'string'
    || !Number.isSafeInteger(value.priceCents)
    || !Number.isSafeInteger(value.stock)
    || !Number.isSafeInteger(value.quantity)
  ) {
    return false
  }

  if (
    value.key !== `${value.productId}:${value.sku}`
    || value.quantity < 1
    || value.stock < value.quantity
    || value.stock < 1
    || value.sizeMl < 1
    || value.priceCents < 1
    || !Number.isSafeInteger(value.priceCents * value.stock)
  ) {
    return false
  }
  if (typeof value.imageUrl !== 'string' || typeof value.imageAlt !== 'string') return false
  if (value.imageUrl) {
    try {
      if (new URL(value.imageUrl).protocol !== 'https:') return false
    } catch {
      return false
    }
  }

  return true
}

export function readCart(storage) {
  try {
    const saved = (storage ?? globalThis.localStorage).getItem(CART_STORAGE_KEY)
    if (saved === null) return { items: [], error: '' }

    const items = JSON.parse(saved)
    if (
      !Array.isArray(items)
      || !items.every(isCartItem)
      || new Set(items.map((item) => item.key)).size !== items.length
    ) {
      return { items: [], error: 'Your saved cart could not be read. Add an item to start a new cart.' }
    }

    return { items, error: '' }
  } catch {
    return { items: [], error: 'Your saved cart could not be read. Add an item to start a new cart.' }
  }
}

export function writeCart(items, storage) {
  const targetStorage = storage ?? globalThis.localStorage
  targetStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

export function createCartItem(product, variant) {
  const productId = String(product._id || product.slug || '')
  const sku = String(variant.sku || '')
  const sizeMl = Number(variant.sizeMl)
  const priceCents = Number(variant.priceCents)
  const stock = Number(variant.stock)
  if (
    !productId
    || !sku
    || !Number.isSafeInteger(sizeMl)
    || sizeMl < 1
    || !Number.isSafeInteger(priceCents)
    || priceCents < 1
    || !Number.isSafeInteger(stock)
    || stock < 1
    || !Number.isSafeInteger(priceCents * stock)
  ) {
    return undefined
  }

  const candidateImageUrl = String(product.images?.[0]?.url || '')
  let imageUrl = ''
  if (candidateImageUrl) {
    try {
      if (new URL(candidateImageUrl).protocol === 'https:') imageUrl = candidateImageUrl
    } catch {
      imageUrl = ''
    }
  }

  return {
    key: `${productId}:${sku}`,
    productId,
    sku,
    name: String(product.name || ''),
    brand: String(product.brand || ''),
    sizeMl,
    concentration: String(variant.concentration || ''),
    priceCents,
    stock,
    quantity: 1,
    imageUrl,
    imageAlt: String(product.images?.[0]?.altText || `${product.brand} ${product.name}`),
  }
}

export function addCartItem(items, item) {
  const existing = items.find((entry) => entry.key === item.key)
  if (!existing) return { items: [...items, item], added: true }
  if (existing.quantity >= item.stock) return { items, added: false }

  return {
    items: items.map((entry) => (
      entry.key === item.key
        ? { ...entry, quantity: Math.min(entry.quantity + 1, item.stock), stock: item.stock }
        : entry
    )),
    added: true,
  }
}

export function setCartQuantity(items, key, quantity) {
  if (!Number.isFinite(quantity)) return items

  return items.map((item) => (
    item.key === key
      ? { ...item, quantity: Math.max(1, Math.min(item.stock, Math.floor(quantity))) }
      : item
  ))
}

export function getCartCount(items) {
  return items.reduce((count, item) => count + item.quantity, 0)
}

export function getCartSubtotal(items) {
  return items.reduce((subtotal, item) => subtotal + item.priceCents * item.quantity, 0)
}

export function removeCartItem(items, key) {
  return items.filter((item) => item.key !== key)
}
