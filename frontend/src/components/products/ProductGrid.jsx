// frontend/src/components/products/ProductGrid.jsx
import { useProducts } from "../../store/productStore.jsx";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const { filtered } = useProducts();

  return (
    <div className="container">
      <div className="products-grid">
        {filtered.length === 0 ? (
          <p className="no-products">No products found</p>
        ) : (
          filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}