// src/components/products/ProductCard.jsx
import { useCart } from "../../store/cartStore";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <div className="product-card">
      <div className="product-image-container">
        {product.images?.length > 0 ? (
          <img
            src={`http://localhost:8000${product.images[0]}`}
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="no-image">No image</div>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">₹{product.price.toFixed(0)}</p>
        <p className="product-stock">Stock: {product.stock}</p>

        <div className="product-reviews">
          {product.reviews?.length > 0 ? (
            product.reviews.map((r, i) => (
              <div key={i} className="review-item">
                Rating: {r.rating}/5 {r.comment}
              </div>
            ))
          ) : (
            <span className="no-reviews">No reviews yet</span>
          )}
        </div>

        <button
          className="add-to-cart-btn"
          disabled={product.stock <= 0}
          onClick={() => addToCart(product, 1)}
        >
          {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
