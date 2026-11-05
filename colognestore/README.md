# React client

This folder contains the Cologne Store React/Vite client. The setup guide, project architecture, and MongoDB/API instructions live in the repository [README](../README.md).

Run the client from the repository root with:

```powershell
npm --prefix .\colognestore run dev
npm --prefix .\colognestore run lint
npm --prefix .\colognestore run build
```

In development, Vite proxies `/api` requests to the Express API at `http://localhost:5000`.

The shop catalog reads products from that API. The shopping bag is persisted in browser local storage and shows an estimated subtotal; checkout must verify current prices and stock on the backend. Run the cart unit tests from the repository root with:

```powershell
npm --prefix .\colognestore test
```
