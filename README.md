# Cologne Store — reusable MERN foundation

A reusable starting point for a full-stack store: a React/Vite client, an Express/Node API, and MongoDB through Mongoose. The project includes product APIs and customer authentication, a database-backed storefront catalog, and a browser-persisted shopping cart. Checkout and payment are staged for a later phase; this starter is not yet a production e-commerce system.

## Architecture

```text
colognestore/
├── .env.example
├── .gitignore
├── package.json                 # API scripts and backend dependencies
├── server.js                    # Loads configuration, connects DB, starts API
├── server/
│   ├── app.js                   # Express middleware and route wiring
│   ├── config/
│   │   ├── database.js          # Mongoose connection
│   │   └── env.js               # Validated environment configuration
│   ├── controllers/
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── authenticate.js
│   │   ├── csrfProtection.js
│   │   └── notFound.js
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   └── validators/
└── colognestore/                # React/Vite client
    ├── .env.example              # Public client branding configuration only
    ├── src/
    │   ├── components/          # Shared UI (next phases)
    │   ├── config/
    │   │   └── site.js           # Reusable store name and brand settings
    │   ├── pages/               # Route-level screens (next phases)
    │   ├── services/
    │   │   ├── api.js           # Client-to-API requests
    │   │   └── cart.js          # Browser cart persistence and calculations
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json             # Client dependencies and scripts
    └── vite.config.js           # Proxies /api to the local Express API
```

Keep database access in models/services, HTTP concerns in routes/controllers, and reusable presentation in client components. This separation lets the Cologne Store features grow without making the starter harder to adapt to another MERN application.

## Dependencies

**Frontend**

- `react`, `react-dom`, `vite`, `@vitejs/plugin-react` — browser UI and local/build tooling.

**Backend**

- `express` — HTTP API and middleware.
- `mongoose` — MongoDB connection and schema/model layer.
- `dotenv` — load local configuration from `.env`.
- `cors`, `helmet` — origin allowlisting and HTTP security headers.
- `cookie-parser`, `jsonwebtoken`, `bcryptjs` — cookie-based sessions, signed tokens, and password hashing.
- `express-rate-limit` — basic API and authentication rate limits.
- `zod` — request payload and query validation.

Add feature-specific packages only when their phase is implemented and tested. Later phases may add React Router, Stripe, image storage, and email delivery. Do not put secret keys in Vite variables: `VITE_*` values are shipped to browsers.

## Prerequisites and setup

Use Node.js 22.12+ (or a Vite-supported current Node release) and npm. Run these commands from the repository root:

1. Install the backend and frontend packages:

   ```powershell
   npm install
   npm --prefix .\colognestore install
   ```

2. Create your private local environment file if you do not already have one:

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

   The example points to a local MongoDB instance. For MongoDB Atlas, create a database and database user, allow your development IP address in Network Access, then put your Atlas connection string in `MONGO_URI`. Keep credentials private. `.env` is ignored by Git; do not overwrite an existing `.env`.

   Generate a separate random JWT secret with `node -p "require('node:crypto').randomBytes(48).toString('base64url')"` and set it as `JWT_SECRET` in `.env`. The secret must be at least 32 bytes and must never be committed.

   Optionally copy `.\colognestore\.env.example` to `.\colognestore\.env` to customize the public `VITE_STORE_NAME` and `VITE_STORE_TAGLINE`. Only public, non-secret settings belong in the client environment.

3. Start the API in a terminal at the repository root:

   ```powershell
   npm run dev
   ```

4. Start the React client in a second terminal at the repository root:

   ```powershell
   npm --prefix .\colognestore run dev
   ```

   Open `http://localhost:5173` (Vite uses a strict port so its origin matches the API allowlist). Vite forwards `/api` requests to `http://localhost:5000`.

The API waits for MongoDB before listening. `GET /api/health` reports API/database readiness. If startup cannot connect, check that MongoDB is running and `MONGO_URI` is correct.

For cross-origin deployment, set `CLIENT_ORIGIN` to the exact browser origin (no trailing slash). Multiple origins can be comma-separated. Keep `COOKIE_SAME_SITE=lax` for same-site deployment; if the frontend and API are on different sites, use HTTPS and set `COOKIE_SAME_SITE=none`. The API enables credentialed CORS only for the allowlisted origins.

## Useful commands

```powershell
npm run dev
npm start
npm test
npm run admin:promote -- customer@example.com
npm --prefix .\colognestore run dev
npm --prefix .\colognestore run lint
npm --prefix .\colognestore run build
npm --prefix .\colognestore test
```

## API foundation (Phase 2)

Implemented:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, and `GET /api/auth/csrf`.
- `GET /api/products` with pagination, search, filters, and allowlisted sorting; `GET /api/products/:slug`.
- Admin-only product routes: `GET /api/products/admin`, `POST /api/products`, `PATCH /api/products/:id`, and `DELETE /api/products/:id` (archive).
- Customer/admin roles, bcrypt password hashes, short-lived JWTs in HttpOnly cookies, signed double-submit CSRF tokens, strict origin allowlisting, rate limits, request validation, and centralized error responses.
- Mongoose user/product models and API tests.

Before calling write endpoints, fetch `GET /api/auth/csrf`; send the returned value in the `X-CSRF-Token` header. The browser API helper handles this for future client forms. Registration never accepts a caller-selected role. To grant your own existing account administrator access from the command line, run the `admin:promote` command after registering it.

Product prices are stored as integer cents to avoid floating-point rounding; clients should format them for display. Product image URLs are validated, but upload/storage integration is not implemented yet.

The storefront catalog reads active products from `GET /api/products` and sends search, brand, fragrance-family, collection, concentration, price-range, and sorting filters to the API. The cart is persisted in the browser's local storage and shows an estimated subtotal. Cart data and browser-displayed prices are not trusted for payment; checkout must re-read current product prices and inventory from MongoDB on the server. Frontend cart tests run with `npm --prefix .\colognestore test`.

To reuse the starter for another storefront, change `VITE_STORE_NAME` and `VITE_STORE_TAGLINE` in the client environment. Keep application-specific settings in the client `config` and add domain behavior in server models/services rather than coupling it to UI components.

Still out of scope for this phase: email verification/password reset, customer profile/address management, wishlist, reviews, order persistence, checkout/payments, inventory reservation/order workflows, a visual admin UI, production index migrations, and deployment. Do not declare the application production-ready or represent demo products as real inventory.
