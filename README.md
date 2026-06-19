# Local E-Commerce Agent

A local e-commerce demo combining a FastAPI backend with a React + Vite frontend and a conversational voice assistant integration.

## Project Overview

This repository contains two main parts:

- `backend/`: FastAPI API server, SQLite persistence, image upload support, and an optional MCP server for voice assistant tool integration.
- `frontend/`: React + Vite storefront with product browsing, search, category filtering, cart checkout, and a voice assistant panel.

## Architecture

### Backend

The backend is located in `backend/app/`.

- `main.py`: FastAPI app configuration, CORS middleware, route registration, and static uploads mount.
- `db.py`: SQLite configuration using SQLAlchemy.
- `models.py`: SQLAlchemy models for `Product`, `ProductImage`, `Review`, `Order`, and `Query`.
- `routes/`: API routes for products, orders, reviews, and customer queries.
- `schemas/`: Pydantic models for request validation.
- `mcp/mcp_server.py`: Optional local JSON-RPC MCP server to support ElevenLabs-style voice assistant tool integration.

### Frontend

The frontend is a Vite-powered React app in `frontend/`.

- `src/App.jsx`: main application composition and UI wiring.
- `src/services/api.js`: API client for backend requests.
- `src/services/voiceAgent.js`: dynamic ElevenLabs voice assistant loader and tool handling.
- `src/store/`: React context stores for products, cart, and voice agent state.
- `src/components/`: UI components for navigation, products, cart, and voice assistant panel.

## Backend API Endpoints

### Products

- `GET /products/`
  - Returns list of products with attached image URLs and review data.
- `GET /products/search?q=...`
  - Search products by name.
- `POST /products/`
  - Create a new product.
- `POST /products/{product_id}/upload-image`
  - Upload an image for a product.

### Orders

- `POST /orders/?product_id=<id>&quantity=<qty>`
  - Place an order and decrement stock.

### Reviews

- `POST /reviews/`
  - Add a review for a product.
- `GET /reviews/{product_id}`
  - Fetch reviews for a product.

### Queries

- `POST /queries/`
  - Submit a customer query; currently stored with a placeholder answer.

### Static Files

- `/uploads`: Serves uploaded product images from `backend/app/uploads/product_images`.

## Data Persistence

- Uses SQLite at `backend/app/shop.db`.
- On startup, `Base.metadata.create_all(bind=engine)` ensures database tables are created automatically.

## CORS Configuration

The backend allows requests from:

- `http://localhost:5173` — default Vite development server.
- `http://localhost:3000` — optional Create React App development server fallback.

This means the backend accepts browser requests from either frontend dev port without CORS blocking.

## Voice Assistant Integration

The frontend attempts to load `@elevenlabs/client` dynamically and start a conversation session.

The local MCP server at `http://localhost:8765` exposes a tool-driven interface for the voice assistant:

- `search_products`
- `add_to_cart`
- `ask_query`
- `get_reviews`

The voice assistant panel listens for events and can update the UI with search results, current product details, and cart interactions.

## Frontend Features

- Product browsing grid.
- Search input filter.
- Category filter dropdown.
- Cart drawer with quantity updates, item removal, and checkout.
- Checkout triggers backend order placement and reloads products.
- Voice assistant panel for hands-free interaction.
- Product cards display images, stock, and review summaries.

## Local Development Setup

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If you want the local MCP server:

```bash
cd backend/app/mcp
python mcp_server.py
```

or from the repo root:

```bash
cd backend/app/mcp
python mcp_server.py
```

The MCP server runs at `http://localhost:8765`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend should be available at `http://localhost:5173`.

## Notes

- The frontend API base is hard-coded to `http://localhost:8000`.
- Product images are loaded from the backend static mount and displayed via `http://localhost:8000/uploads/...`.
- The voice assistant logic currently depends on `@elevenlabs/client` being available and the MCP server optionally supplying tool call events.
- There is no built-in product seeding script, so you can add products using the API or manually insert records into the SQLite database.

## Recommended Run Sequence

1. Start backend API: `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. Start MCP server (optional voice support): `python backend/app/mcp/mcp_server.py`
3. Start frontend: `cd frontend && npm install && npm run dev`
4. Open the frontend at `http://localhost:5173`

## Useful Files

- `backend/requirements.txt`
- `backend/app/main.py`
- `backend/app/db.py`
- `backend/app/models.py`
- `backend/app/routes/`
- `backend/app/mcp/mcp_server.py`
- `frontend/package.json`
- `frontend/src/App.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/voiceAgent.js`

---

If you want, I can also add a short `backend/README.md` and `frontend/README.md` with focused setup steps for each part.
