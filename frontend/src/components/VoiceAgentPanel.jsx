// frontend/src/components/VoiceAgentPanel.jsx
export default function VoiceAgentPanel({ logs }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 70,
        left: 20,
        width: 300,
        maxHeight: 400,
        overflowY: "auto",
        background: "#060000",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 10
      }}
    >
      <h4>Agent Activity</h4>
      {logs.length === 0 && <p>No activity yet</p>}
      {logs.map((log, i) => (
        <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
          • {log}
        </div>
      ))}
    </div>
  );
}
