// frontend/src/components/Cart/CartDrawer.jsx
import { useState } from "react";
import { useCart } from "../../store/cartStore.jsx";
import { useProducts } from "../../store/productStore.jsx";
import { useAgent } from "../../store/agentStore.jsx";
import { placeOrder } from "../../services/api";

export default function CartDrawer() {
  const { cart, open, setOpen, clearCart, updateQuantity, removeFromCart } = useCart();
  const { setProducts, setFiltered } = useProducts();
  const { addLog } = useAgent();
  const [orderConfirm, setOrderConfirm] = useState(null);

  if (!open) return null;

  const checkout = async () => {
    try {
      const orderDetails = [];
      
      for (const item of cart) {
        await placeOrder(item.id, item.quantity);
        addLog(`Purchased ${item.quantity} × ${item.name}`);
        orderDetails.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        });
      }

      // 🔁 Re-fetch products from DB
      const res = await fetch("http://localhost:8000/products/");
      const data = await res.json();
      setProducts(data);
      setFiltered(data);

      const total = orderDetails.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Show confirmation popup
      setOrderConfirm({
        items: orderDetails,
        total: total,
        timestamp: new Date().toLocaleString()
      });

      clearCart();
      addLog("Checkout completed successfully");
    } catch (e) {
      addLog("Checkout failed");
      console.error(e);
    }
  };

  const handleCloseConfirm = () => {
    setOrderConfirm(null);
    setOpen(false);
  };

  const total = cart.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <>
      <div style={styles.drawer}>
        <h3>Cart ({cart.length})</h3>

        {cart.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} style={styles.cartItem}>
                <div>
                  <p style={styles.itemName}>{item.name}</p>
                  <p style={styles.itemPrice}>₹{item.price}</p>
                </div>
                
                <div style={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={styles.btn}
                  >
                    −
                  </button>
                  <span style={styles.quantity}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={styles.btn}
                  >
                    +
                  </button>
                </div>

                <p style={styles.subtotal}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>

                <button
                  onClick={() => removeFromCart(item.id)}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
            ))}

            <div style={styles.total}>
              <h4>Total: ₹{total.toFixed(2)}</h4>
            </div>

            <button onClick={checkout} style={styles.checkoutBtn}>
              Checkout
            </button>
          </>
        )}

        <button onClick={() => setOpen(false)} style={styles.closeBtn}>
          Close
        </button>
      </div>

      {orderConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Order Confirmed</h2>
            
            <div style={styles.confirmDetails}>
              <p style={styles.timestamp}>
                <strong>Order Time:</strong> {orderConfirm.timestamp}
              </p>

              <div style={styles.itemsList}>
                <h4>Order Items:</h4>
                {orderConfirm.items.map((item, idx) => (
                  <div key={idx} style={styles.confirmItem}>
                    <div>
                      <p style={styles.confirmItemName}>{item.name}</p>
                      <p style={styles.confirmItemQty}>
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <p style={styles.confirmItemSubtotal}>
                      ₹{item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div style={styles.confirmTotal}>
                <h3>Total Amount: ₹{orderConfirm.total.toFixed(2)}</h3>
              </div>

              <div style={styles.confirmMessage}>
                <p>Thank you for your order.</p>
                <p>Your order has been successfully placed and will be processed soon.</p>
              </div>
            </div>

            <button onClick={handleCloseConfirm} style={styles.confirmBtn}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  drawer: {
    position: "fixed",
    right: 0,
    top: 0,
    width: 400,
    height: "100%",
    background: "#fff",
    borderLeft: "1px solid #111",
    padding: 16,
    overflowY: "auto",
    boxShadow: "none",
    zIndex: 1000
  },
  cartItem: {
    borderBottom: "1px solid #eee",
    paddingBottom: 12,
    marginBottom: 12
  },
  itemName: {
    fontWeight: "bold",
    margin: "4px 0"
  },
  itemPrice: {
    color: "#666",
    margin: "4px 0",
    fontSize: "0.9em"
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  btn: {
    width: 30,
    height: 30,
    border: "1px solid #ddd",
    background: "#f5f5f5",
    cursor: "pointer",
    borderRadius: 4,
    fontSize: "1em"
  },
  quantity: {
    minWidth: 30,
    textAlign: "center"
  },
  subtotal: {
    fontSize: "0.9em",
    color: "#333",
    marginBottom: 8
  },
  removeBtn: {
    background: "#ff6b6b",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.85em"
  },
  total: {
    borderTop: "2px solid #ddd",
    paddingTop: 12,
    marginTop: 12,
    marginBottom: 12
  },
  checkoutBtn: {
    width: "100%",
    padding: 12,
    background: "#111",
    color: "#fff",
    border: "1px solid #111",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "1em",
    fontWeight: "bold",
    marginBottom: 8
  },
  closeBtn: {
    width: "100%",
    padding: 10,
    background: "#fff",
    color: "#111",
    border: "1px solid #111",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.9em"
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000
  },
  modal: {
    background: "#fff",
    borderRadius: 8,
    padding: 32,
    maxWidth: 500,
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "none",
    border: "1px solid #111"
  },
  modalTitle: {
    color: "#111",
    marginTop: 0,
    marginBottom: 20,
    textAlign: "center",
    fontSize: "1.8em"
  },
  confirmDetails: {
    marginBottom: 20
  },
  timestamp: {
    color: "#666",
    fontSize: "0.9em",
    marginBottom: 16
  },
  itemsList: {
    marginBottom: 16
  },
  confirmItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    background: "#f9f9f9",
    borderRadius: 4,
    marginBottom: 8
  },
  confirmItemName: {
    fontWeight: "bold",
    margin: "0 0 4px 0"
  },
  confirmItemQty: {
    color: "#666",
    fontSize: "0.9em",
    margin: 0
  },
  confirmItemSubtotal: {
    fontWeight: "bold",
    fontSize: "1.1em",
    color: "#111",
    margin: 0
  },
  confirmTotal: {
    borderTop: "2px solid #ddd",
    borderBottom: "2px solid #ddd",
    padding: "16px 0",
    marginBottom: 16,
    textAlign: "center"
  },
  confirmMessage: {
    background: "#f7f7f7",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    textAlign: "center",
    color: "#111"
  },
  confirmBtn: {
    width: "100%",
    padding: 12,
    background: "#111",
    color: "#fff",
    border: "1px solid #111",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "1em",
    fontWeight: "bold"
  }
};
