import { useEffect, useMemo, useState } from 'react'
import { siteConfig } from './config/site.js'
import { getApiHealth, getProducts } from './services/api.js'
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

function ProductCard({ product }) {
  const image = product.images?.[0]
  const availableVariants = product.variants?.filter((variant) => variant.stock > 0) ?? []
  const lowestPrice = product.minPriceCents
    ?? Math.min(...(product.variants ?? []).map((variant) => variant.priceCents))

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
            {product.variants?.length === 1
              ? `${product.variants[0].sizeMl} ml`
              : `${product.variants?.length ?? 0} sizes`}
          </span>
          <span className="product-price">
            {Number.isFinite(lowestPrice) ? `From ${formatPrice(lowestPrice)}` : 'Price unavailable'}
          </span>
        </div>
        <p className={`stock-note ${availableVariants.length ? '' : 'is-unavailable'}`}>
          {availableVariants.length ? 'Available to discover' : 'Currently unavailable'}
        </p>
      </div>
    </article>
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
        <a className="header-note" href="#collection">Considered fragrance</a>
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
                <ProductCard key={product._id || product.slug} product={product} />
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
    </div>
  )
}

export default App
