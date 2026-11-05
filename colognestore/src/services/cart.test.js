import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addCartItem,
  createCartItem,
  getCartCount,
  getCartSubtotal,
  readCart,
  removeCartItem,
  setCartQuantity,
  writeCart,
} from './cart.js'

const product = {
  _id: 'product-1',
  name: 'Evening Ember',
  brand: 'Atelier North',
  images: [{ url: 'https://images.example.com/ember.jpg', altText: 'Amber bottle' }],
}

const variant = {
  sku: 'EE-50-EDP',
  sizeMl: 50,
  concentration: 'EDP',
  priceCents: 12500,
  stock: 3,
}

function createMemoryStorage() {
  const entries = new Map()
  return {
    getItem(key) {
      return entries.get(key) ?? null
    },
    setItem(key, value) {
      entries.set(key, value)
    },
  }
}

test('cart persists valid items and rejects tampered or malformed stored data', () => {
  const storage = createMemoryStorage()
  const item = createCartItem(product, variant)

  writeCart([item], storage)
  assert.deepEqual(readCart(storage), { items: [item], error: '' })

  storage.setItem('colognestore-cart-v1', '{invalid')
  assert.match(readCart(storage).error, /saved cart could not be read/i)

  storage.setItem('colognestore-cart-v1', JSON.stringify([{ ...item, imageUrl: 'javascript:alert(1)' }]))
  assert.match(readCart(storage).error, /saved cart could not be read/i)

  storage.setItem('colognestore-cart-v1', JSON.stringify([item, item]))
  assert.match(readCart(storage).error, /saved cart could not be read/i)
})

test('cart adds a variant, merges matching items, and never exceeds available stock', () => {
  const item = createCartItem(product, variant)
  const first = addCartItem([], item)
  assert.equal(first.added, true)
  assert.equal(first.items[0].quantity, 1)

  const second = addCartItem(first.items, item)
  const third = addCartItem(second.items, item)
  const outOfStock = addCartItem(third.items, item)

  assert.equal(third.items[0].quantity, variant.stock)
  assert.equal(outOfStock.added, false)
  assert.equal(outOfStock.items[0].quantity, variant.stock)
  assert.equal(createCartItem(product, { ...variant, priceCents: Number.MAX_SAFE_INTEGER }), undefined)
})

test('cart quantity, subtotal, count, and removal stay consistent', () => {
  const first = createCartItem(product, variant)
  const second = createCartItem(product, { ...variant, sku: 'EE-100-EDP', priceCents: 20000 })
  const items = [first, second]
  const updated = setCartQuantity(items, first.key, 2)

  assert.equal(getCartCount(updated), 3)
  assert.equal(getCartSubtotal(updated), 45000)
  assert.equal(setCartQuantity(updated, first.key, 99)[0].quantity, variant.stock)
  assert.equal(setCartQuantity(updated, first.key, Number.NaN)[0].quantity, 2)
  assert.deepEqual(removeCartItem(updated, first.key), [second])
})
