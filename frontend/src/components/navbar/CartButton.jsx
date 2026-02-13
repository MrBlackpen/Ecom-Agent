// frontend/src/components/navbar/CartButton.jsx
import { useCart } from "../../store/cartStore.jsx";

export default function CartButton() {
  const { cart, setOpen } = useCart();

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={() => setOpen(true)}
      style={{
        position: "relative",
        padding: "8px 12px",
        borderRadius: 6,
        cursor: "pointer",
        background: "#000000ff",
        color: "#f5eeeeff",
        border: "1px solid #f5eeeeff"
      }}
    >
      Cart
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            background: "#111",
            color: "#fff",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: 12
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
