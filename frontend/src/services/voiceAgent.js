// frontend/src/services/voiceAgent.js
import { fetchProducts } from "./api";

export async function startVoiceAgent({
  setActive,
  addLog,
  setProducts,
  addToCart,
  setSearchResults,
  setCurrentProduct,
  setAgentMessage,
  conversationRef,
}) {
  console.debug("startVoiceAgent() called");
  const mod = await import("@elevenlabs/client");
  console.debug("@elevenlabs/client loaded", Object.keys(mod || {}));

  // Prefer VoiceConversation (client-side), fall back to Conversation/TextConversation
  const Conversation =
    mod.VoiceConversation ||
    mod.Conversation ||
    mod.TextConversation ||
    mod.default?.Conversation;

  console.debug("Using conversation class:",
    mod.VoiceConversation ? "VoiceConversation" : mod.TextConversation ? "TextConversation" : mod.Conversation ? "Conversation" : "unknown");

  if (!Conversation?.startSession) {
    throw new Error("Conversation.startSession not available");
  }

  addLog("Starting voice agent...");
  console.debug("About to call Conversation.startSession", { Conversation: !!Conversation });

  // define a reusable handler so we can attach it both via options and event listeners
  let _lastToolSig = null;
  let _lastToolTime = 0;

  const makeToolSig = (tool) => {
    try {
      return `${tool?.name}|${JSON.stringify(tool?.arguments||tool?.args||{})}|${tool?.message||''}`;
    } catch (e) { return null; }
  };

  const handleToolCall = async (tool) => {
    // dedupe identical tool calls arriving via multiple paths
    try {
      const sig = makeToolSig(tool);
      const now = Date.now();
      if (sig && sig === _lastToolSig && now - _lastToolTime < 1000) {
        return; // ignore duplicate within 1s
      }
      _lastToolSig = sig;
      _lastToolTime = now;
    } catch (e) {
      // ignore sig errors
    }
    console.log("🔍 onToolCall triggered with:", tool);
    console.log("Tool keys:", Object.keys(tool || {}));

    const toolName = tool?.name || tool?.function?.name;
    addLog(`${toolName} called`);

    if (toolName === "search_products") {
      let results = null;
      try {
        if (Array.isArray(tool?.result?.result)) {
          results = tool.result.result;
        } else if (Array.isArray(tool?.result)) {
          results = tool.result;
        }
      } catch (_) {}
      try {
        if (!results) {
          const q =
            tool?.arguments?.query ||
            tool?.args?.query ||
            tool?.parameters?.query ||
            tool?.input?.query ||
            "";
          const res = await fetch(
            q
              ? `http://localhost:8765/`
              : `http://localhost:8000/products/`,
            q
              ? {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "tools/call",
                    params: { name: "search_products", arguments: { query: q } },
                  }),
                }
              : undefined
          );
          if (res && res.ok) {
            const body = await res.json();
            const list =
              body?.result?.content?.[0]?.text
                ? null
                : body?.result?.entries || body?.result?.result || body?.result;
            if (Array.isArray(list)) results = list;
          }
        }
      } catch (_) {}
      try {
        const updated = await fetchProducts();
        setProducts(updated);
      } catch (_) {}
      try {
        if (Array.isArray(results)) {
          setSearchResults(results);
          try {
            if (results.length > 0 && typeof setCurrentProduct === "function") {
              setCurrentProduct(results[0]);
            }
          } catch (_) {}
        } else {
          setSearchResults([]);
        }
      } catch (_) {}
      addLog("Products refreshed");
    }

    if (toolName === "add_to_cart") {
      console.log("add_to_cart tool object structure:", JSON.stringify(tool, null, 2));

      // Try multiple ways to extract productId
      let productId =
        tool.args?.product_id ||
        tool.parameters?.product_id ||
        tool.input?.product_id ||
        tool.arguments?.product_id;

      let quantity =
        tool.args?.quantity ||
        tool.parameters?.quantity ||
        tool.input?.quantity ||
        tool.arguments?.quantity ||
        1;

      console.log("Extracted productId:", productId, "quantity:", quantity);

      if (productId) {
        try {
          const products = await fetchProducts();
          const prod = products.find((p) => Number(p.id) === Number(productId));

          if (prod) {
            addToCart(prod, Number(quantity || 1));
            addLog(`Added ${quantity} × ${prod.name} to cart`);
            try {
              if (setCurrentProduct) setCurrentProduct(prod);
              const msgText =
                tool?.result?.message ||
                tool?.message ||
                `Added ${quantity} × ${prod.name} to cart`;
              if (setAgentMessage) setAgentMessage(msgText);
            } catch (_) {}
          } else {
            // Fallback: add minimal product object so cart updates
            addToCart({ id: Number(productId), name: `Product ${productId}`, price: 0 }, Number(quantity || 1));
            addLog(`Added product ${productId} to cart`);
            try {
              const minimal = { id: Number(productId), name: `Product ${productId}`, price: 0, stock: 0, category: "" };
              if (setCurrentProduct) setCurrentProduct(minimal);
              const msgText =
                tool?.result?.message ||
                tool?.message ||
                `Added ${quantity} × Product ${productId} to cart`;
              if (setAgentMessage) setAgentMessage(msgText);
            } catch (_) {}
          }
        } catch (err) {
          console.error("Failed to fetch products for add_to_cart fallback:", err);
          addLog("add_to_cart failed to resolve product details");
        }
      } else {
        console.warn("⚠️ Could not extract product_id from tool object:", tool);
        addLog("add_to_cart missing product_id");
      }
    }

    const text =
      tool?.result?.content?.[0]?.text ||
      tool?.content?.[0]?.text ||
      tool?.message;

    if (text) addLog(`${text}`);
  };

  const conversation = await Conversation.startSession({
    agentId: "agent_id",
    // ✅ ALL EVENTS ARE PASSED HERE
    onTranscript: (msg) => {
      if (msg?.text) addLog(`${msg.text}`);
    },

    onAgentResponse: (msg) => {
      if (msg?.text) addLog(`${msg.text}`);
    },

    onToolCall: handleToolCall,

    onError: (err) => {
      console.error("Agent error:", err);
      addLog(`❌ Agent error: ${err?.message || "Unknown"}`);
    },
  });

  console.debug("Conversation started:", !!conversation, "hasOn:", !!(conversation && conversation.on));

  // Some SDK variants emit events via `conversation.on("tool_call", ...)`
  try {
    if (conversation && conversation.on) {
      conversation.on("tool_call", handleToolCall);
    }
  } catch (err) {
    // ignore
  }

  // Start polling MCP server for recent tool calls as a fallback (local dev)
  try {
    let lastId = 0;
    const processedIds = new Set();

    // if conversationRef provided, store reference early so cleanup can access it
    if (conversationRef) conversationRef.current = conversation;

    // clear any previous poll left behind
    try {
      if (conversationRef && conversationRef.current && conversationRef.current._mcpPoll) {
        clearInterval(conversationRef.current._mcpPoll);
        delete conversationRef.current._mcpPoll;
      }
    } catch (e) {}

    // Perform initial sync to advance cursor to latest existing entry without processing
    try {
      const initRes = await fetch("http://localhost:8765/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "recent_tool_calls", params: { since_id: 0 } }),
      });
      if (initRes.ok) {
        const initBody = await initRes.json();
        const initEntries = initBody?.result?.entries || [];
        for (const e of initEntries) {
          lastId = Math.max(lastId, e.id || 0);
          processedIds.add(e.id);
        }
      }
    } catch (err) {
      // ignore initial sync errors
    }

    const poll = async () => {
      try {
        const res = await fetch("http://localhost:8765/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "recent_tool_calls", params: { since_id: lastId } }),
        });
        if (!res.ok) return;
        const body = await res.json();
        const entries = body?.result?.entries || [];
        for (const e of entries) {
          // skip already processed ids
          if (processedIds.has(e.id)) continue;
          processedIds.add(e.id);
          // advance cursor before processing
          lastId = Math.max(lastId, e.id || 0);
          const tool = { name: e.name, arguments: e.arguments, result: e.result, message: e.message, _mcpId: e.id };
          handleToolCall(tool);
        }
      } catch (err) {
        // ignore polling errors
      }
    };
    const id = setInterval(poll, 1500);

    // attach poll id and processedIds for cleanup
    if (conversation) {
      conversation._mcpPoll = id;
      conversation._mcpProcessed = processedIds;
    }
  } catch (err) {
    // ignore
  }

  // ✅ store reference
  if (conversationRef) {
    conversationRef.current = conversation;
  }

  // attach cleanup helper to clear poll and detach listeners
  try {
    conversation._cleanup = () => {
      try {
        if (conversation && conversation.off) conversation.off("tool_call", handleToolCall);
      } catch (e) {}
      try {
        if (conversation && conversation._mcpPoll) clearInterval(conversation._mcpPoll);
      } catch (e) {}
      try {
        if (conversation && conversation._mcpProcessed) {
          try { conversation._mcpProcessed.clear(); } catch (_) {}
          try { delete conversation._mcpProcessed; } catch (_) {}
        }
      } catch (e) {}
    };
  } catch (err) {
    // ignore
  }

  setActive(true);
  addLog("Voice agent ready");

  return conversation;
}
