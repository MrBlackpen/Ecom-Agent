// frontend/src/App.jsx
import { useEffect, useRef, useState } from "react";

import ProductGrid from "./components/ProductGrid";
import VoiceAgentButton from "./components/VoiceAgentButton";
import VoiceAgentPanel from "./components/VoiceAgentPanel";
import { fetchProducts } from "./services/api";

export default function App() {
  const conversationRef = useRef(null);
  const [micActive, setMicActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);

  /* -------------------------
     Load products
  ------------------------- */
  const loadProducts = async () => {
    const data = await fetchProducts();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /* -------------------------
     ElevenLabs Agent Events
  ------------------------- */
  // No-op effect; listeners are attached after `startSession` succeeds.
  useEffect(() => {}, []);

  /* -------------------------
     Toggle Conversation
  ------------------------- */
  const toggleConversation = async () => {
    if (!micActive) {
      try {
        const mod = await import("@elevenlabs/client");
        const Conv = mod?.Conversation || mod?.default?.Conversation || mod?.default;
        if (!Conv || !Conv.startSession) throw new Error("Conversation.startSession not found in @elevenlabs/client");

        const convInstance = await Conv.startSession({
          agentId: "agent_6601kgt0hb7ye8ntm0nnbdpms65x",
        });

        conversationRef.current = convInstance;

        // attach listeners
        if (convInstance && convInstance.on) {
          const onTranscript = (msg) => setLogs((l) => [...l, `🗣️ ${msg.text}`]);
          const onAgentResponse = (msg) => setLogs((l) => [...l, `🤖 ${msg.text}`]);
          const onToolCall = (tool) => {
            setLogs((l) => [...l, `🛠️ ${tool.name} called`]);
            if (["place_order", "search_product"].includes(tool.name)) {
              loadProducts();
            }
          };
          const onError = (e) => {
            console.error(e);
            setLogs((l) => [...l, "❌ Agent error"]);
          };

          convInstance.on("transcript", onTranscript);
          convInstance.on("agent_response", onAgentResponse);
          convInstance.on("tool_call", onToolCall);
          convInstance.on("error", onError);

          conversationRef.current._cleanup = () => {
            try {
              if (convInstance.off) {
                convInstance.off("transcript", onTranscript);
                convInstance.off("agent_response", onAgentResponse);
                convInstance.off("tool_call", onToolCall);
                convInstance.off("error", onError);
              }
            } catch (err) {
              // ignore
            }
          };
        }

        setMicActive(true);
        setLogs((l) => [...l, "🎙️ Voice agent started"]);
      } catch (err) {
        console.error("Failed to start session:", err);
      }
    } else {
      try {
        if (conversationRef.current && conversationRef.current.endSession) {
          await conversationRef.current.endSession();
        }
        if (conversationRef.current && conversationRef.current._cleanup) {
          try {
            conversationRef.current._cleanup();
          } catch (_) {}
          delete conversationRef.current._cleanup;
        }
      } catch (err) {
        console.error("Failed to end session:", err);
      }
      setMicActive(false);
      setLogs((l) => [...l, "🛑 Voice agent stopped"]);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <VoiceAgentButton active={micActive} onClick={toggleConversation} />
      <VoiceAgentPanel logs={logs} />

      <h2>🛒 Local E-Shopping Platform</h2>
      <ProductGrid products={products} />
    </div>
  );
}
