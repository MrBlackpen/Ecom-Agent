// frontend/src/components/VoiceAgentButton.jsx
export default function VoiceAgentButton({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        top: 20,
        left: 20,
        padding: "10px 14px",
        borderRadius: 30,
        border: "none",
        cursor: "pointer",
        background: active ? "#e74c3c" : "#2ecc71",
        color: "#fff",
        fontWeight: "bold"
      }}
    >
      {active ? "⛔ Stop Agent" : "🎙️ Voice Agent"}
    </button>
  );
}
