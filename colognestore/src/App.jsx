import { useEffect, useMemo, useRef, useState } from 'react'
import { siteConfig } from './config/site.js'
import { getApiHealth, getProducts } from './services/api.js'
import {
  addCartItem,
  createCartItem,
  getCartCount,
  getCartSubtotal,
  readCart,
  removeCartItem,
  setCartQuantity,
  writeCart,
} from './services/cart.js'
import './App.css'

const initialFilters = {
  q: '',
  brand: '',
  fragranceFamily: '',
  gender: '',
  concentration: '',
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatPrice(priceCents) {
  return currency.format(priceCents / 100)
}

function ProductCard({ product, cartItems, onAdd }) {
  const [selectedSku, setSelectedSku] = useState(
    product.variants?.find((variant) => variant.stock > 0)?.sku
      || product.variants?.[0]?.sku
      || '',
  )
  const image = product.images?.[0]
  const variants = product.variants ?? []
  const selectedVariant = variants.find((variant) => variant.sku === selectedSku) ?? variants[0]
  const productId = String(product._id || product.slug)
  const cartQuantity = cartItems.find(
    (item) => item.productId === productId && item.sku === selectedVariant?.sku,
  )?.quantity ?? 0
  const lowestPrice = product.minPriceCents
    ?? Math.min(...variants.map((variant) => variant.priceCents))

  return (
    <article className="product-card">
      <div className="product-image-frame">
        {product.featured && <span className="product-badge">Featured</span>}
        {image ? (
          <img
            className="product-image"
            src={image.url}
            alt={image.altText || `${product.brand} ${product.name}`}
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder" aria-label="No product image available">
            <span>{product.brand}</span>
            <span className="placeholder-rule" />
            <span>Image coming soon</span>
          </div>
        )}
      </div>
      <div className="product-copy">
        <p className="product-brand">{product.brand}</p>
        <h3>{product.name}</h3>
        <p className="product-family">{product.fragranceFamily}</p>
        <div className="product-meta">
          <span>
            {variants.length === 1 ? `${variants[0].sizeMl} ml` : `${variants.length} sizes`}
          </span>
          <span className="product-price">
            {Number.isFinite(lowestPrice) ? `From ${formatPrice(lowestPrice)}` : 'Price unavailable'}
          </span>
        </div>
        {variants.length > 1 && (
          <label className="variant-picker">
            <span>Choose a size</span>
            <select
              aria-label={`Choose a size of ${product.name}`}
              value={selectedVariant?.sku || ''}
              onChange={(event) => setSelectedSku(event.target.value)}
            >
              {variants.map((variant) => (
                <option key={variant.sku} value={variant.sku} disabled={variant.stock < 1}>
                  {variant.sizeMl} ml · {variant.concentration}{variant.stock < 1 ? ' · Sold out' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        {selectedVariant && (
          <p className={`stock-note ${selectedVariant.stock > 0 ? '' : 'is-unavailable'}`}>
            {selectedVariant.stock > 0
              ? `${selectedVariant.stock} available`
              : 'Currently unavailable'}
          </p>
        )}
        <button
          className="button button-outline add-to-cart"
          type="button"
          disabled={!selectedVariant || selectedVariant.stock < 1}
          onClick={() => onAdd(product, selectedVariant)}
        >
          {cartQuantity ? `Add another · ${cartQuantity} in bag` : 'Add to bag'}
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </article>
  )
}

function CartDialog({
  isOpen,
  items,
  itemCount,
  subtotal,
  storageError,
  notice,
  onClose,
  onQuantityChange,
  onRemove,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className="cart-dialog"
      aria-labelledby="cart-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="cart-panel">
        <div className="cart-header">
          <div>
            <p className="eyebrow">A considered selection</p>
            <h2 id="cart-title">Your bag <span>({itemCount})</span></h2>
          </div>
          <button className="cart-close" type="button" aria-label="Close shopping bag" onClick={onClose}>
            ×
          </button>
        </div>

        {storageError && <p className="cart-notice" role="status">{storageError}</p>}
        {notice && <p className="cart-notice" role="status">{notice}</p>}

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your bag is taking a moment for itself.</p>
            <button className="button button-dark" type="button" onClick={onClose}>
              Continue exploring
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map((item) => (
                <li className="cart-item" key={item.key}>
                  <div className="cart-item-image">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.imageAlt} />
                      : <span aria-hidden="true">{item.brand.slice(0, 1)}</span>}
                  </div>
                  <div className="cart-item-details">
                    <p className="product-brand">{item.brand}</p>
                    <h3>{item.name}</h3>
                    <p>{item.sizeMl} ml · {item.concentration}</p>
                    <div className="cart-item-actions">
                      <div className="quantity-control" aria-label={`Quantity of ${item.name}`}>
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={item.quantity <= 1}
                          onClick={() => onQuantityChange(item, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={item.quantity >= item.stock}
                          onClick={() => onQuantityChange(item, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-button remove-item"
                        type="button"
                        onClick={() => onRemove(item)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="cart-item-price">{formatPrice(item.priceCents * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="cart-summary">
              <div><span>Estimated subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <p>Shipping, tax, current pricing, and stock are confirmed at checkout.</p>
              <button className="button button-dark checkout-placeholder" type="button" disabled>
                Checkout coming next
              </button>
              <button className="text-button continue-shopping" type="button" onClick={onClose}>
                Continue exploring
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}

function ProductSkeleton() {
  return (
    <div className="product-skeleton" aria-hidden="true">
      <div className="skeleton-image" />
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
      <div className="skeleton-line medium" />
    </div>
  )
}

function App() {
  const [initialCart] = useState(readCart)
  const [health, setHealth] = useState({ status: 'loading' })
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const [catalog, setCatalog] = useState({
    key: null,
    status: 'loading',
    products: [],
    pagination: { total: 0 },
    error: '',
  })
  const [reloadCount, setReloadCount] = useState(0)
  const [cartItems, setCartItems] = useState(initialCart.items)
  const [cartStorageError, setCartStorageError] = useState(initialCart.error)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartNotice, setCartNotice] = useState('')

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: '12', sort: filters.sort })
    for (const field of ['q', 'brand', 'fragranceFamily', 'gender', 'concentration']) {
      const value = filters[field].trim()
      if (value) params.set(field, value)
    }

    for (const field of ['minPrice', 'maxPrice']) {
      if (filters[field] !== '') {
        params.set(
          field === 'minPrice' ? 'minPriceCents' : 'maxPriceCents',
          String(Math.round(Number(filters[field]) * 100)),
        )
      }
    }

    return params.toString()
  }, [filters])
  const requestKey = `${queryString}:${reloadCount}`
  const catalogStatus = catalog.key === requestKey ? catalog.status : 'loading'
  const products = catalog.key === requestKey ? catalog.products : []
  const pagination = catalog.key === requestKey ? catalog.pagination : { total: 0 }
  const catalogError = catalog.key === requestKey ? catalog.error : ''
  const cartCount = getCartCount(cartItems)
  const cartSubtotal = getCartSubtotal(cartItems)

  useEffect(() => {
    document.title = `${siteConfig.name} | ${siteConfig.tagline}`
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    getApiHealth({ signal: controller.signal })
      .then((result) => setHealth(result))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setHealth({ status: 'error', message: error.message })
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    getProducts(queryString, { signal: controller.signal })
      .then((result) => {
        if (!Array.isArray(result?.products)) {
          throw new Error('The product API returned an invalid response.')
        }
        setCatalog({
          key: requestKey,
          status: 'ready',
          products: result.products,
          pagination: result.pagination ?? { total: result.products.length },
          error: '',
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setCatalog({
            key: requestKey,
            status: 'error',
            products: [],
            pagination: { total: 0 },
            error: error.message,
          })
        }
      })

    return () => controller.abort()
  }, [queryString, requestKey])

  function saveCart(items) {
    try {
      writeCart(items)
      setCartStorageError('')
    } catch {
      setCartStorageError('Your cart could not be saved on this device. It may not be here after you leave.')
    }
  }

  function updateDraft(field, value) {
    setDraftFilters((current) => ({ ...current, [field]: value }))
  }

  function submitFilters(event) {
    event.preventDefault()
    setFilters({ ...draftFilters })
    setReloadCount((count) => count + 1)
  }

  function resetFilters() {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
    setReloadCount((count) => count + 1)
  }

  function addToCart(product, variant) {
    const item = createCartItem(product, variant)
    if (!item) {
      setCartNotice('This fragrance option is not currently available.')
      setCartOpen(true)
      return
    }

    const result = addCartItem(cartItems, item)
    setCartItems(result.items)
    saveCart(result.items)
    setCartNotice(
      result.added
        ? `${item.sizeMl} ml ${item.name} added to your bag.`
        : `${item.name} has reached the available stock quantity.`,
    )
    setCartOpen(true)
  }

  function changeCartQuantity(item, quantity) {
    const updatedItems = setCartQuantity(cartItems, item.key, quantity)
    setCartItems(updatedItems)
    saveCart(updatedItems)
  }

  function removeFromCart(item) {
    const updatedItems = removeCartItem(cartItems, item.key)
    setCartItems(updatedItems)
    saveCart(updatedItems)
    setCartNotice(`${item.name} removed from your bag.`)
  }

  const apiIsReady = health.status === 'ok'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label={`${siteConfig.name} home`}>
          <span className="wordmark-mark" aria-hidden="true">C</span>
          <span>{siteConfig.name}</span>
        </a>
        <nav className="primary-nav" aria-label="Main navigation">
          <a className="active" href="#collection">Shop</a>
          <a href="#story">Our approach</a>
        </nav>
        <button
          className="header-note bag-trigger"
          type="button"
          aria-haspopup="dialog"
          onClick={() => { setCartNotice(''); setCartOpen(true) }}
        >
          Your bag <span>({cartCount})</span>
        </button>
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Fragrance, with intention</p>
            <h1 id="hero-title">A scent that<br /><em>stays with you.</em></h1>
            <p className="hero-intro">
              Discover considered fragrances chosen for the moments, moods, and memories
              that make them yours.
            </p>
            <a className="button button-dark" href="#collection">
              Explore the collection <span aria-hidden="true">↗</span>
            </a>
            <p className="hero-edition">THE SCENT EDIT <span>—</span> VOL. 01</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun" />
            <div className="art-caption">Notes<br />of the<br />everyday</div>
            <span className="art-index">01 / 04</span>
          </div>
          <span className="hero-side-note" aria-hidden="true">FIND YOUR SIGNATURE</span>
        </section>

        <section className="collection-section" id="collection" aria-labelledby="collection-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The Cologne Store selection</p>
              <h2 id="collection-title">Find your <em>fragrance.</em></h2>
            </div>
            <p className="section-description">
              Thoughtfully selected scents, ready to become part of your story.
            </p>
          </div>

          <form className="catalog-filters" onSubmit={submitFilters}>
            <div className="filter-search">
              <label htmlFor="search">Search the collection</label>
              <div className="search-control">
                <span aria-hidden="true">⌕</span>
                <input
                  id="search"
                  name="q"
                  type="search"
                  maxLength="100"
                  placeholder="Name, note, or brand"
                  value={draftFilters.q}
                  onChange={(event) => updateDraft('q', event.target.value)}
                />
              </div>
            </div>
            <div className="filter-field">
              <label htmlFor="brand">Brand</label>
              <input
                id="brand"
                name="brand"
                maxLength="100"
                placeholder="Any brand"
                value={draftFilters.brand}
                onChange={(event) => updateDraft('brand', event.target.value)}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="family">Fragrance family</label>
              <input
                id="family"
                name="fragranceFamily"
                maxLength="60"
                placeholder="Any family"
                value={draftFilters.fragranceFamily}
                onChange={(event) => updateDraft('fragranceFamily', event.target.value)}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="gender">Collection</label>
              <select
                id="gender"
                name="gender"
                value={draftFilters.gender}
                onChange={(event) => updateDraft('gender', event.target.value)}
              >
                <option value="">All collections</option>
                <option value="men">For him</option>
                <option value="women">For her</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="concentration">Concentration</label>
              <select
                id="concentration"
                name="concentration"
                value={draftFilters.concentration}
                onChange={(event) => updateDraft('concentration', event.target.value)}
              >
                <option value="">All concentrations</option>
                <option value="EDT">Eau de Toilette</option>
                <option value="EDP">Eau de Parfum</option>
                <option value="Parfum">Parfum</option>
                <option value="Elixir">Elixir</option>
              </select>
            </div>
            <fieldset className="price-filter">
              <legend>Price range (USD)</legend>
              <label className="visually-hidden" htmlFor="min-price">Minimum price in dollars</label>
              <input
                id="min-price"
                name="minPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Min"
                value={draftFilters.minPrice}
                onChange={(event) => updateDraft('minPrice', event.target.value)}
              />
              <span aria-hidden="true">–</span>
              <label className="visually-hidden" htmlFor="max-price">Maximum price in dollars</label>
              <input
                id="max-price"
                name="maxPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Max"
                value={draftFilters.maxPrice}
                onChange={(event) => updateDraft('maxPrice', event.target.value)}
              />
            </fieldset>
            <div className="filter-field sort-field">
              <label htmlFor="sort">Sort by</label>
              <select
                id="sort"
                name="sort"
                value={draftFilters.sort}
                onChange={(event) => updateDraft('sort', event.target.value)}
              >
                <option value="newest">Recently added</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
            <div className="filter-actions">
              <button className="button button-dark" type="submit">Apply filters</button>
              <button className="text-button" type="button" onClick={resetFilters}>Clear all</button>
            </div>
          </form>

          <div className="results-heading">
            <p>
              {catalogStatus === 'ready'
                ? `${pagination.total ?? products.length} ${pagination.total === 1 ? 'fragrance' : 'fragrances'}`
                : 'The collection'}
            </p>
            {health.status !== 'loading' && (
              <span className={`api-status ${apiIsReady ? 'is-ready' : ''}`}>
                <span aria-hidden="true" />
                {apiIsReady ? 'Live collection' : 'Store connection unavailable'}
              </span>
            )}
          </div>

          {catalogStatus === 'loading' && (
            <div className="product-grid" aria-busy="true" aria-label="Loading fragrances">
              {Array.from({ length: 4 }, (_, index) => <ProductSkeleton key={index} />)}
            </div>
          )}

          {catalogStatus === 'error' && (
            <div className="catalog-message error-message" role="alert">
              <p className="eyebrow">Unable to load the collection</p>
              <h3>We couldn’t reach the fragrance catalog.</h3>
              <p>{catalogError}</p>
              <button
                className="button button-dark"
                type="button"
                onClick={() => setReloadCount((count) => count + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {catalogStatus === 'ready' && products.length === 0 && (
            <div className="catalog-message empty-message" role="status">
              <p className="eyebrow">A quieter moment</p>
              <h3>No fragrances found.</h3>
              <p>Try a different search or clear your filters to explore the collection.</p>
              <button className="text-button" type="button" onClick={resetFilters}>Clear filters</button>
            </div>
          )}

          {catalogStatus === 'ready' && products.length > 0 && (
            <div className="product-grid" aria-live="polite">
              {products.map((product) => (
                <ProductCard
                  key={product._id || product.slug}
                  product={product}
                  cartItems={cartItems}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </section>

        <section className="story-section" id="story" aria-labelledby="story-title">
          <p className="eyebrow">A more personal ritual</p>
          <h2 id="story-title">The right fragrance<br />feels like <em>coming home.</em></h2>
          <p>
            We believe a fragrance is more than a finishing touch. It is an invitation
            to slow down, notice more, and make the everyday feel entirely your own.
          </p>
          <a className="text-link" href="#collection">Explore the selection <span aria-hidden="true">↗</span></a>
        </section>
      </main>

      <footer className="footer">
        <a className="wordmark" href="#home">{siteConfig.name}</a>
        <span>Fragrance, with intention.</span>
        <a href="#home">Back to top ↑</a>
      </footer>
      <CartDialog
        isOpen={cartOpen}
        items={cartItems}
        itemCount={cartCount}
        subtotal={cartSubtotal}
        storageError={cartStorageError}
        notice={cartNotice}
        onClose={() => setCartOpen(false)}
        onQuantityChange={changeCartQuantity}
        onRemove={removeFromCart}
      />
    </div>
  )
}

export default App
