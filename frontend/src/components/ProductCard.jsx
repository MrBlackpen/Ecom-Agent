// frontend/src/components/ProductCard.jsx
export default function ProductCard({ product }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      
      {/* Images */}
      <div style={{ display: "flex", gap: 6 }}>
        {product.images.map((img, i) => (
          <img
            key={i}
            src={`http://localhost:8000${img}`}
            alt=""
            width={80}
            height={80}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ))}
      </div>

      <h4>{product.name}</h4>
      <p>₹{product.price}</p>

      {/* Reviews */}
      <div>
        <strong>Reviews</strong>
        {product.reviews.length === 0 && <p>No reviews yet</p>}
        {product.reviews.map((r, i) => (
          <div key={i} style={{ fontSize: 12 }}>
            ⭐ {r.rating} — {r.comment}
          </div>
        ))}
      </div>
    </div>
  );
}
