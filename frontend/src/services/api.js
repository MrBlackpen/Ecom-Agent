// frontend/src/services/api.js
const API_BASE = "http://localhost:8000";

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products/`);
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}
