import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

/**
 * Navbar — appears on every page.
 * Shows navigation links, wallet connection button, and ALUT balance.
 */
export default function Navbar({ wallet }) {
  const {
    address,
    shortAddress,
    alutBalance,
    connectWallet,
    disconnectWallet,
    isConnecting,
    error,
  } = wallet;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="brand-icon">🎓</span>
          <span className="brand-name">ALU Logo Registry</span>
        </Link>
      </div>

      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Home
        </NavLink>
        <NavLink to="/register" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Register Logo
        </NavLink>
        <NavLink to="/verify" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Verify Logo
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Dashboard
        </NavLink>
      </div>

      <div className="navbar-wallet">
        {address ? (
          <div className="wallet-connected">
            <div className="wallet-info">
              <span className="wallet-address" title={address}>
                🟢 {shortAddress}
              </span>
              <span className="wallet-balance">
                {alutBalance} ALUT
              </span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>

      {error && (
        <div className="navbar-error">
          ⚠️ {error}
        </div>
      )}
    </nav>
  );
}

