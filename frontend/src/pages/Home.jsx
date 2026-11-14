import { Link } from "react-router-dom";

export default function Home({ wallet }) {
  const { address, connectWallet, isConnecting, error } = wallet;

  return (
    <div>
      <div className="page-header">
        <h1>🎓 ALU Logo Registry dApp</h1>
        <p>
          A decentralised application for registering and verifying the
          official African Leadership University logo on the blockchain.
        </p>
      </div>

      {/* Wallet connection prompt */}
      {!address && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🦊</div>
          <h2>Connect Your Web3 Wallet</h2>
          <p style={{ marginBottom: "1.5rem", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
            Connect MetaMask (or any Web3 wallet) to register logo assets and
            manage token distribution. The Verify page works without a wallet.
          </p>
          <button
            className="btn btn-primary"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <><span className="spinner" /> Connecting…</>
            ) : (
              "Connect Wallet"
            )}
          </button>
          {error && (
            <div className="alert alert-warning" style={{ marginTop: "1rem", textAlign: "left" }}>
              <span className="alert-icon">⚠️</span>
              <div className="alert-body">
                <div className="alert-title">Wallet Error</div>
                <div className="alert-desc">{error}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connected — show feature cards */}
      {address && (
        <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
          <span className="alert-icon">✅</span>
          <div className="alert-body">
            <div className="alert-title">Wallet Connected</div>
            <div className="alert-desc">
              You are connected as <strong>{address}</strong>. You can now use all features below.
            </div>
          </div>
        </div>
      )}

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        <div className="card">
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📋</div>
          <h3>Register a Logo</h3>
          <p style={{ marginBottom: "1rem" }}>
            Upload an image to generate its SHA-256 hash and register it as a
            permanent NFT on the blockchain. Requires a connected wallet.
          </p>
          <Link to="/register" className="btn btn-primary btn-sm">
            Go to Register →
          </Link>
        </div>

        <div className="card">
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</div>
          <h3>Verify a Logo</h3>
          <p style={{ marginBottom: "1rem" }}>
            Upload any logo file to instantly verify whether it matches the
            official ALU logo registered on the blockchain. No wallet needed.
          </p>
          <Link to="/verify" className="btn btn-outline btn-sm">
            Go to Verify →
          </Link>
        </div>

        <div className="card">
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📊</div>
          <h3>Token Dashboard</h3>
          <p style={{ marginBottom: "1rem" }}>
            View ALUT token ownership percentages and distribute shares to
            stakeholders. Owner-only distribution controls included.
          </p>
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            Go to Dashboard →
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>How It Works</h3>
        <hr className="divider" />
        <ol style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <li>
            <strong>Connect</strong> your MetaMask wallet to the Hardhat local network (Chain ID 31337).
          </li>
          <li>
            <strong>Register</strong> a logo by uploading an image — the app hashes it in your browser and writes it to the blockchain as an NFT.
          </li>
          <li>
            <strong>Verify</strong> any logo file to check whether its SHA-256 hash matches what is recorded on-chain.
          </li>
          <li>
            <strong>Distribute</strong> ALUT ownership tokens to stakeholders from the Dashboard (contract owner only).
          </li>
        </ol>
      </div>
    </div>
  );
}

