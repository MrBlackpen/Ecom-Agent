// frontend/src/components/agent/VoiceAgentPanel.jsx
import { useAgent } from "../../store/agentStore.jsx";
import { useProducts } from "../../store/productStore.jsx";
import { useCart } from "../../store/cartStore.jsx";
import { useEffect, useState } from "react";

export default function VoiceAgentPanel() {
  const { active, currentProduct, agentMessage, searchResults, setActive, conversationRef, setSearchResults, setCurrentProduct, setAgentMessage } = useAgent();
  const { products } = useProducts();
  const { cart } = useCart();
  if (!active) return null;

  const prod = currentProduct
    ? products.find((x) => Number(x.id) === Number(currentProduct.id)) || currentProduct
    : null;
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        try {
          // stop speaking agent session
          if (conversationRef?.current?.endSession) {
            try { conversationRef.current.endSession(); } catch (_) {}
          }
          if (conversationRef?.current?._cleanup) {
            try { conversationRef.current._cleanup(); } catch (_) {}
          }
          try { conversationRef.current = null; } catch (_) {}
          // reset panel state to fresh
          try { setCurrentProduct(null); } catch (_) {}
          try { setAgentMessage(""); } catch (_) {}
          try { setSearchResults([]); } catch (_) {}
          setActive(false);
        } catch (_) {}
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActive, conversationRef, setCurrentProduct, setAgentMessage, setSearchResults]);

  useEffect(() => {
    if (agentMessage) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(t);
    }
  }, [agentMessage]);

  return (
    <>
      <div style={styles.overlay} />
      <div style={styles.modal}>
        <img src="/mic_logo.png" alt="Agent" style={styles.micCorner} />
        <div style={styles.contentWrap}>
          {!prod && (!Array.isArray(searchResults) || searchResults.length === 0) ? (
            <div style={styles.logoWrap}>
              <div style={styles.intro}>
                <div style={styles.heading}>SMART MARKET Voice Assistant</div>
                <div style={styles.sub}>
                  Search products, view details in real time, and add to cart hands-free.
                </div>
              </div>
            </div>
          ) : prod ? (
            <div style={styles.card}>
              <div style={styles.imageBox}>
                {prod?.images?.length > 0 ? (
                  <img
                    src={`http://localhost:8000${prod.images[0]}`}
                    alt={prod.name}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.noImage}>No image</div>
                )}
              </div>
              <div style={styles.details}>
                <div style={styles.title}>{prod.name}</div>
                <div style={styles.meta}>
                  ₹{Number(prod.price || 0).toFixed(0)} • Stock: {prod.stock || 0} • {prod.category || ""}
                </div>
                {agentMessage && <div style={styles.message}>{agentMessage}</div>}
              </div>
            </div>
          ) : null}

          {!prod && Array.isArray(searchResults) && searchResults.length > 0 && (
            <div style={styles.list}>
              {searchResults.map((p) => {
                const full = products.find((x) => Number(x.id) === Number(p.id)) || p;
                return (
                  <div key={p.id} style={styles.item}>
                    <div style={styles.itemImageBox}>
                      {full?.images?.length > 0 ? (
                        <img
                          src={`http://localhost:8000${full.images[0]}`}
                          alt={full.name}
                          style={styles.itemImage}
                        />
                      ) : (
                        <div style={styles.noImage}>No image</div>
                      )}
                    </div>
                    <div style={styles.itemDetails}>
                      <div style={styles.itemTitle}>{full.name}</div>
                      <div style={styles.itemMeta}>
                        ₹{Number(full.price || 0).toFixed(0)} • Stock: {full.stock || 0} • {full.category || ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {Array.isArray(cart) && cart.length > 0 && (
            <div style={styles.cartList}>
              <div style={styles.cartHeading}>Cart</div>
              {cart.map((c) => (
                <div key={c.id} style={styles.item}>
                  <div style={styles.itemImageBox}>
                    {c?.images?.length > 0 ? (
                      <img
                        src={`http://localhost:8000${c.images[0]}`}
                        alt={c.name}
                        style={styles.itemImage}
                      />
                    ) : (
                      <div style={styles.noImage}>No image</div>
                    )}
                  </div>
                  <div style={styles.itemDetails}>
                    <div style={styles.itemTitle}>{c.name}</div>
                    <div style={styles.itemMeta}>
                      Qty: {c.quantity} • ₹{Number(c.price || 0).toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showToast && agentMessage && (
        <div style={styles.toast}>{agentMessage}</div>
      )}
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(2px)",
    zIndex: 2000
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 860,
    maxWidth: "92vw",
    height: 520,
    maxHeight: "85vh",
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #111",
    padding: 16,
    zIndex: 2001,
    boxShadow: "none",
    display: "block"
  },
  contentWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    height: "100%",
  },
  micCorner: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    objectFit: "cover",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    gridColumn: "1 / -1",
  },
  intro: {
    textAlign: "center",
    maxWidth: 520,
  },
  heading: {
    fontWeight: 700,
    fontSize: "1.6rem",
    marginBottom: 8,
    textAlign: "center",
  },
  sub: {
    color: "#555",
  },
  card: {
    display: "flex",
    gap: 16,
    width: "100%",
    alignItems: "center",
  },
  imageBox: {
    width: 240,
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    background: "#f0f0f0",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #111",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  noImage: {
    fontSize: 13,
    color: "#777",
  },
  details: {
    flex: 1,
  },
  title: {
    fontWeight: 700,
    fontSize: "1.2rem",
    marginBottom: 6,
  },
  meta: {
    color: "#555",
    marginBottom: 12,
  },
  message: {
    borderTop: "1px solid #111",
    paddingTop: 10,
  },
  list: {
    position: "relative",
    overflowY: "auto",
    borderTop: "1px solid #eee",
    paddingTop: 10,
  },
  cartList: {
    position: "relative",
    overflowY: "auto",
    borderTop: "1px solid #eee",
    paddingTop: 10,
  },
  cartHeading: {
    fontWeight: 700,
    marginBottom: 6,
  },
  item: {
    display: "flex",
    gap: 12,
    padding: 8,
    border: "1px solid #eee",
    borderRadius: 10,
    marginBottom: 8,
    background: "#fafafa",
  },
  itemImageBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    background: "#f0f0f0",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #111",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: 600,
    marginBottom: 4,
  },
  itemMeta: {
    color: "#555",
  },
  toast: {
    position: "fixed",
    bottom: 24,
    right: 24,
    background: "#111",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    zIndex: 3000,
    border: "1px solid #111"
  }
};
