// frontend/src/navbar/SearchBar.jsx
import { useProducts } from "../../store/productStore.jsx";

export default function SearchBar() {
  const { setSearchQuery } = useProducts();

  const onSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <input
      className="search-input"
      placeholder="Search products"
      style={{ width: 480 }}
      onChange={onSearch}
    />
  );
}
