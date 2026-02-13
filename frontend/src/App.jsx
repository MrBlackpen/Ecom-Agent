// frontend/src/App.jsx
// import { useEffect, useRef, useState } from "react";

// import ProductGrid from "./components/ProductGrid";
// import VoiceAgentButton from "./components/VoiceAgentButton";
// import VoiceAgentPanel from "./components/VoiceAgentPanel";
// import { fetchProducts } from "./services/api";
// import Cart from "./components/Cart";

// export default function App() {
//   const conversationRef = useRef(null);
//   const [micActive, setMicActive] = useState(false);
//   const [logs, setLogs] = useState([]);
//   const [products, setProducts] = useState([]);

//   /* -------------------------
//      Load products
//   ------------------------- */
//   const loadProducts = async () => {
//     const data = await fetchProducts();
//     setProducts(data);
//   };

//   useEffect(() => {
//     loadProducts();
//   }, []);

//   /* -------------------------
//      ElevenLabs Agent Events
//   ------------------------- */
//   // No-op effect; listeners are attached after `startSession` succeeds.
//   useEffect(() => {}, []);

//   /* -------------------------
//      Toggle Conversation
//   ------------------------- */
//   const toggleConversation = async () => {
//     if (!micActive) {
//       try {
//         const mod = await import("@elevenlabs/client");
//         const Conv = mod?.Conversation || mod?.default?.Conversation || mod?.default;
//         if (!Conv || !Conv.startSession) throw new Error("Conversation.startSession not found in @elevenlabs/client");

//         const convInstance = await Conv.startSession({
//           agentId: "agent_8901kh1gq7xcejz8849b8qqxg3ph",
//         });

//         conversationRef.current = convInstance;

//         // attach listeners
//         if (convInstance && convInstance.on) {
//           const onTranscript = (msg) => setLogs((l) => [...l, `🗣️ ${msg.text}`]);
//           const onAgentResponse = (msg) => setLogs((l) => [...l, `🤖 ${msg.text}`]);
//           const onToolCall = (tool) => {
//             setLogs((l) => [...l, `🛠️ ${tool.name} called with ${JSON.stringify(tool.arguments || {})}`]);
//             if (["place_order", "search_products"].includes(tool.name)) {
//               loadProducts();
//             }
//           };
//           const onError = (e) => {
//             console.error(e);
//             setLogs((l) => [...l, "❌ Agent error"]);
//           };

//           convInstance.on("transcript", onTranscript);
//           convInstance.on("agent_response", onAgentResponse);
//           convInstance.on("tool_call", onToolCall);
//           convInstance.on("error", onError);

//           conversationRef.current._cleanup = () => {
//             try {
//               if (convInstance.off) {
//                 convInstance.off("transcript", onTranscript);
//                 convInstance.off("agent_response", onAgentResponse);
//                 convInstance.off("tool_call", onToolCall);
//                 convInstance.off("error", onError);
//               }
//             } catch (err) {
//               // ignore
//             }
//           };
//         }

//         setMicActive(true);
//         setLogs((l) => [...l, "🎙️ Voice agent started"]);
//       } catch (err) {
//         console.error("Failed to start session:", err);
//       }
//     } else {
//       try {
//         if (conversationRef.current && conversationRef.current.endSession) {
//           await conversationRef.current.endSession();
//         }
//         if (conversationRef.current && conversationRef.current._cleanup) {
//           try {
//             conversationRef.current._cleanup();
//           } catch (_) {}
//           delete conversationRef.current._cleanup;
//         }
//       } catch (err) {
//         console.error("Failed to end session:", err);
//       }
//       setMicActive(false);
//       setLogs((l) => [...l, "🛑 Voice agent stopped"]);
//     }
//   };

//   return (
//     <div style={{ padding: 40 }}>
//       <VoiceAgentButton active={micActive} onClick={toggleConversation} />
//       {micActive && <VoiceAgentPanel logs={logs} />}

//       <h2>🛒 Local E-Shopping Platform</h2>
//       <ProductGrid products={products} />
//     </div>
//   );
// }

//frontend/src/App.jsx
import { useEffect } from "react";
import { fetchProducts } from "./services/api";
import { startVoiceAgent } from "./services/voiceAgent";

import { ProductProvider, useProducts } from "./store/productStore.jsx";
import { CartProvider, useCart } from "./store/cartStore.jsx";
import { AgentProvider, useAgent } from "./store/agentStore.jsx";

import Navbar from "./components/navbar/Navbar";
import ProductGrid from "./components/products/ProductGrid";
import CartDrawer from "./components/cart/CartDrawer";
import VoiceAgentPanel from "./components/agent/VoiceAgentPanel";

function AppContent() {
  const { products, setProducts, setFiltered } = useProducts();
  const { addToCart } = useCart();
  const { active, setActive, addLog, conversationRef, setSearchResults, setCurrentProduct, setAgentMessage } = useAgent();

  /* Load products */
  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
      setFiltered(data);
    });
  }, []);

  /* Toggle Voice Agent */
  // In AppContent function
  const toggleAgent = async () => {
    console.log("Toggle clicked — current active:", active);

    if (active) {
      // ── STOP ──
      try {
        if (conversationRef.current?.endSession) {
          await conversationRef.current.endSession();
          addLog("Voice agent stopped");
        }
      } catch (err) {
        console.error("Error stopping agent:", err);
        addLog("⚠️ Error while stopping agent");
      }
      conversationRef.current = null;
      setActive(false);
      try { setCurrentProduct(null); } catch (_) {}
      try { setAgentMessage(""); } catch (_) {}
      try { setSearchResults([]); } catch (_) {}
    } else {
      // ── START ──
      try {
        addLog("Starting voice agent...");
        try { setCurrentProduct(null); } catch (_) {}
        try { setAgentMessage(""); } catch (_) {}
        try { setSearchResults([]); } catch (_) {}
        await startVoiceAgent({
          setActive,           // pass setter directly
          addLog,
          setProducts,
          addToCart,
          setSearchResults,
          setCurrentProduct,
          setAgentMessage,
          conversationRef,     // optional
        });
        // Only set active = true AFTER successful start
        setActive(true);
        addLog("Voice agent ready");
      } catch (err) {
        console.error("Voice start failed:", err);
        addLog(`❌ Could not start voice agent: ${err.message}`);
        setActive(false); // safety
      }
    }
  };

  return (
    <>
      <Navbar onToggleAgent={toggleAgent} />
      <ProductGrid />
      <CartDrawer />
      <VoiceAgentPanel />
    </>
  );
}

export default function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <AgentProvider>
          <AppContent />
        </AgentProvider>
      </CartProvider>
    </ProductProvider>
  );
}
