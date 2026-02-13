// frontend/src/components/navbar/Navbar.jsx
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";
import CartButton from "./CartButton";
import VoiceAgentButton from "../agent/VoiceAgentButton.jsx";

export default function Navbar({ onToggleAgent }) {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <h1 className="logo">SMART MARKET</h1>

        <div className="nav-controls">
          <SearchBar />
          <CategoryFilter />
          <CartButton />
          <VoiceAgentButton onClick={onToggleAgent} />
        </div>
      </div>
    </nav>
  );
}
