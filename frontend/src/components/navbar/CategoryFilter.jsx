// frontend/src/components/navbar/CategoryFilter.jsx
import { useProducts } from "../../store/productStore.jsx";

export default function CategoryFilter() {
  const { products, setSelectedCategory } = useProducts();

  // 1️⃣ Normalize + remove empty categories
  const categories = [
    ...new Set(
      products
        .map(p => p.category)
        .filter(Boolean)
        .map(c => c.trim())
    )
  ];

  return (
    <select
      className="category-select"
      style={{ width: 200 }}
      onChange={(e) => {
        setSelectedCategory(e.target.value);
      }}
    >
      {/* 2️⃣ Give ALL a key */}
      <option key="ALL" value="ALL">
        All
      </option>

      {/* 3️⃣ Guaranteed-unique keys */}
      {categories.map((c, idx) => (
        <option key={`${c}-${idx}`} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
