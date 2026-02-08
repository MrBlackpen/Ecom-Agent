// frontend/src/components/ProductGrid.jsx
import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}