import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import ALULogoTokenABI from "../abis/ALULogoToken.json";
import { CONTRACT_ADDRESSES } from "../constants.js";
import { formatTokenAmount, shortenAddress } from "../utils/hash.js";

// Three example addresses — Hardhat's first three default accounts
const EXAMPLE_ACCOUNTS = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];

function getTokenContract(signerOrProvider) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ALULogoToken,
    ALULogoTokenABI,
    signerOrProvider
  );
}

export default function Dashboard({ wallet }) {
  const { address, signer, provider, isOwner, refreshBalance } = wallet;

  const [totalSupply, setTotalSupply]       = useState(null);
  const [myBalance, setMyBalance]           = useState(null);
  const [myPercentage, setMyPercentage]     = useState(null);
  const [exampleData, setExampleData]       = useState([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [dashError, setDashError]           = useState(null);

  // Distribution form
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount]       = useState("");
  const [isTxPending, setIsTxPending] = useState(false);
  const [txSuccess, setTxSuccess]     = useState(null);
  const [txError, setTxError]         = useState(null);

  // ── Load dashboard data ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!address || !provider) return;
    setIsLoading(true);
    setDashError(null);

    try {
      const token = getTokenContract(provider);

      const [supply, balance, percentage] = await Promise.all([
        token.totalSupply(),
        token.balanceOf(address),
        token.ownershipPercentage(address),
      ]);

      setTotalSupply(formatTokenAmount(supply));
      setMyBalance(formatTokenAmount(balance));
      setMyPercentage(percentage.toString());

      // Load example accounts
      const examples = await Promise.all(
        EXAMPLE_ACCOUNTS.map(async (addr) => {
          const [bal, pct] = await Promise.all([
            token.balanceOf(addr),
            token.ownershipPercentage(addr),
          ]);
          return { address: addr, balance: formatTokenAmount(bal), percentage: pct.toString() };
        })
      );
      setExampleData(examples);
    } catch (err) {
      if (err.message?.includes("ECONNREFUSED") || err.message?.includes("could not detect")) {
        setDashError("Cannot connect to the local blockchain. Make sure your Hardhat node is running.");
      } else {
        setDashError("Failed to load token data: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [address, provider]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Distribute shares ─────────────────────────────────────────────────────
  async function handleDistribute(e) {
    e.preventDefault();
    setTxError(null);
    setTxSuccess(null);

    // Validate inputs
    if (!ethers.isAddress(recipient)) {
      setTxError("Invalid recipient address. Please enter a valid Ethereum address.");
      return;
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setTxError("Amount must be greater than zero.");
      return;
    }

    setIsTxPending(true);
    try {
      const token = getTokenContract(signer);
      // Convert to 18-decimal wei
      const rawAmount = ethers.parseUnits(amount.toString(), 18);

      // This will trigger MetaMask
      const tx = await token.distributeShares(recipient, rawAmount);
      await tx.wait();

      setTxSuccess(`Successfully distributed ${amountNum.toLocaleString()} ALUT to ${shortenAddress(recipient)}.`);
      setRecipient("");
      setAmount("");

      // Refresh all balances
      await loadData();
      await refreshBalance();
    } catch (err) {
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setTxError("Transaction cancelled — you rejected the wallet signature.");
      } else if (err.message?.includes("OwnableUnauthorizedAccount") || err.message?.includes("caller is not the owner")) {
        setTxError("Only the contract owner can distribute shares.");
      } else if (err.message?.includes("ERC20InsufficientBalance")) {
        setTxError("Insufficient balance — the owner does not have enough ALUT tokens.");
      } else {
        setTxError("Distribution failed: " + (err.reason || err.message));
      }
    } finally {
      setIsTxPending(false);
    }
  }

  // ── Wallet gate ───────────────────────────────────────────────────────────
  if (!address) {
    return (
      <div>
        <div className="page-header">
          <h1>Token Distribution Dashboard</h1>
          <p>View ALUT token ownership and distribute shares to stakeholders.</p>
        </div>
        <div className="wallet-gate card">
          <div className="gate-icon">🔒</div>
          <h2>Wallet Required</h2>
          <p>Please connect your wallet to view the token dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Token Distribution Dashboard</h1>
        <p>
          ALUT (ALU Logo Token) represents ownership shares in the registered
          ALU logo. Total supply: 1,000,000 tokens.
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="alert alert-info">
          <span className="alert-icon">⏳</span>
          <div className="alert-body"><div className="alert-desc">Loading token data from blockchain…</div></div>
        </div>
      )}

      {/* Dashboard error */}
      {dashError && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <div className="alert-body">
            <div className="alert-title">Could Not Load Data</div>
            <div className="alert-desc">{dashError}</div>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      {!isLoading && !dashError && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{totalSupply ?? "—"}</div>
              <div className="stat-label">Total ALUT Supply</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{myBalance ?? "—"}</div>
              <div className="stat-label">Your Balance (ALUT)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{myPercentage != null ? myPercentage + "%" : "—"}</div>
              <div className="stat-label">Your Ownership</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{isOwner ? "✅ Yes" : "❌ No"}</div>
              <div className="stat-label">Contract Owner</div>
            </div>
          </div>

          {/* ── Example holders table ── */}
          <div className="card">
            <h3>Wallet Ownership Overview</h3>
            <p style={{ marginBottom: "1rem" }}>
              Snapshot of ALUT balances and ownership percentages for selected wallets.
            </p>
            <table className="meta-table">
              <thead>
                <tr>
                  <th>Wallet Address</th>
                  <th>Balance (ALUT)</th>
                  <th>Ownership %</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#eff6ff" }}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {shortenAddress(address)} <em style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>(you)</em>
                  </td>
                  <td>{myBalance ?? "—"}</td>
                  <td>{myPercentage != null ? myPercentage + "%" : "—"}</td>
                </tr>
                {exampleData.map((entry) => (
                  <tr key={entry.address}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {shortenAddress(entry.address)}
                    </td>
                    <td>{entry.balance}</td>
                    <td>{entry.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Distribute shares form ── */}
      <div className={`card ${!isOwner ? "section-disabled" : ""}`}>
        <h3>
          Distribute Shares
          {!isOwner && (
            <span style={{
              marginLeft: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 400,
              color: "var(--color-text-muted)",
              background: "#f3f4f6",
              padding: "0.2rem 0.5rem",
              borderRadius: "9999px"
            }}>
              Owner Only
            </span>
          )}
        </h3>

        {!isOwner && (
          <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
            <span className="alert-icon">ℹ️</span>
            <div className="alert-body">
              <div className="alert-desc">
                Only the contract owner can distribute ALUT tokens. Your connected
                wallet is not the owner of this contract.
              </div>
            </div>
          </div>
        )}

        {txSuccess && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            <span className="alert-icon">✅</span>
            <div className="alert-body">
              <div className="alert-title">Distribution Successful</div>
              <div className="alert-desc">{txSuccess}</div>
            </div>
          </div>
        )}

        {txError && (
          <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
            <span className="alert-icon">❌</span>
            <div className="alert-body">
              <div className="alert-title">Distribution Failed</div>
              <div className="alert-desc">{txError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleDistribute}>
          <div className="form-group">
            <label htmlFor="recipient">Recipient Wallet Address</label>
            <input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={!isOwner}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount of ALUT Tokens</label>
            <input
              id="amount"
              type="number"
              min="1"
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isOwner}
            />
            <span className="input-hint">
              Current owner balance: {myBalance ?? "—"} ALUT
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isOwner || isTxPending}
          >
            {isTxPending ? (
              <><span className="spinner" /> Waiting for wallet approval…</>
            ) : (
              "Distribute Tokens"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

