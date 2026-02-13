// frontend/src/services/api.js
const API_BASE = "http://localhost:8000";

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products/`);
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}

export async function placeOrder(productId, quantity) {
  const res = await fetch(
    `http://localhost:8000/orders/?product_id=${productId}&quantity=${quantity}`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error("Order failed");
  }

  return res.json();
}
