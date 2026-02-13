// frontend/src/components/agent/VoiceAgentButton.jsx
import { useAgent } from "../../store/agentStore.jsx";

export default function VoiceAgentButton({ onClick }) {
  const { active } = useAgent();

  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        cursor: "pointer",
        background: active ? "#e9e4e4ff" : "#060000ff",
        color: active ? "#000000ff" : "#f5eeeeff",
        border: "1px solid #111"
      }}
    >
      {active ? "Stop Agent" : "Voice Agent"}
    </button>
  );
}
