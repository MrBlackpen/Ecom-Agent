// frontend/src/store/agentStore.js
import { createContext, useContext, useRef, useState, useEffect } from "react";

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const conversationRef = useRef(null);

  const [active, setActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [agentMessage, setAgentMessage] = useState("");

  const addLog = (msg) => {
    setLogs((l) => [...l, msg]);
  };

  useEffect(() => {
    console.log("Agent active changed →", active);
  }, [active]);

  return (
    <AgentContext.Provider
      value={{
        active,
        setActive,
        logs,
        addLog,
        conversationRef,
        searchResults,
        setSearchResults,
        currentProduct,
        setCurrentProduct,
        agentMessage,
        setAgentMessage,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgent must be used inside AgentProvider");
  }
  return ctx;
}
