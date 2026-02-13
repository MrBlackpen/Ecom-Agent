// frontend/src/store/productStore.js
import { createContext, useContext, useState, useEffect } from "react";

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Apply both filters whenever products, search, or category changes
  useEffect(() => {
    let result = products;

    // Apply category filter
    if (selectedCategory !== "ALL") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFiltered(result);
  }, [products, searchQuery, selectedCategory]);

  return (
    <ProductContext.Provider value={{
      products,
      setProducts,
      filtered,
      setFiltered,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);
