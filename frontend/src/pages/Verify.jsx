import { useState, useRef } from "react";
import { ethers } from "ethers";
import { hashFile, formatTimestamp, shortenAddress } from "../utils/hash.js";
import ALUAssetRegistryABI from "../abis/ALUAssetRegistry.json";
import { CONTRACT_ADDRESSES, ALU_LOGO_TOKEN_ID } from "../constants.js";

/**
 * Returns a read-only contract instance — no wallet needed.
 * Uses the browser's built-in JSON-RPC provider pointed at the local Hardhat node.
 */
function getReadOnlyRegistry() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ALUAssetRegistry,
    ALUAssetRegistryABI,
    provider
  );
}

export default function Verify() {
  // Shared
  const [tokenId, setTokenId] = useState(ALU_LOGO_TOKEN_ID.toString());
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null); // { authentic, message, metadata }
  const [error, setError] = useState(null);

  // File mode
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileHash, setFileHash]     = useState("");
  const [isHashing, setIsHashing]   = useState(false);
  const fileInputRef = useRef(null);

  // Hash mode
  const [manualHash, setManualHash] = useState("");

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function verify(hash) {
    setError(null);
    setResult(null);
    setIsVerifying(true);

    try {
      const registry = getReadOnlyRegistry();
      const id = BigInt(tokenId);

      const [authentic, message] = await registry.verifyLogoIntegrity(id, hash);

      let metadata = null;
      if (authentic) {
        const asset = await registry.getAsset(id);
        metadata = {
          assetName: asset.assetName,
          fileType: asset.fileType,
          registrar: asset.registrar,
          timestamp: formatTimestamp(asset.timestamp),
        };
      }

      setResult({ authentic, message, metadata });
    } catch (err) {
      if (err.message?.includes("Asset does not exist")) {
        setError(`No asset found with Token ID ${tokenId}. Make sure the contracts are deployed and the Token ID is correct.`);
      } else if (err.message?.includes("could not detect network") || err.message?.includes("ECONNREFUSED")) {
        setError("Cannot connect to the local blockchain. Make sure your Hardhat node is running (npx hardhat node).");
      } else {
        setError("Verification failed: " + err.message);
      }
    } finally {
      setIsVerifying(false);
    }
  }

  // ── File upload handler ───────────────────────────────────────────────────
  async function handleFileChange(file) {
    if (!file) return;
    setResult(null);
    setError(null);
    setFileHash("");

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setIsHashing(true);
    try {
      const hash = await hashFile(file);
      setFileHash(hash);
      // Auto-verify immediately after hashing
      await verify(hash);
    } catch (err) {
      setError("Failed to hash file: " + err.message);
    } finally {
      setIsHashing(false);
    }
  }

  // ── Manual hash submit ────────────────────────────────────────────────────
  async function handleHashSubmit(e) {
    e.preventDefault();
    if (!manualHash.trim()) { setError("Please enter a hash value."); return; }
    const hash = manualHash.trim().startsWith("0x")
      ? manualHash.trim()
      : "0x" + manualHash.trim();
    await verify(hash);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Verify a Logo</h1>
        <p>
          Check whether any logo file is the authentic ALU logo by comparing its
          cryptographic fingerprint to what is recorded on the blockchain.{" "}
          <strong>No wallet connection required.</strong>
        </p>
      </div>

      {/* Token ID selector */}
      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="tokenId">Token ID to Verify Against</label>
          <input
            id="tokenId"
            type="number"
            min="1"
            value={tokenId}
            onChange={(e) => { setTokenId(e.target.value); setResult(null); }}
            style={{ maxWidth: "180px" }}
          />
          <span className="input-hint">
            Token ID 1 is the official ALU logo registered in Formative 1.
          </span>
        </div>
      </div>

      {/* ── Method 1: File upload ── */}
      <div className="card">
        <h3>Method 1 — Upload a File</h3>
        <p style={{ marginBottom: "1rem" }}>
          Select or drop any logo image. The app will hash it in your browser
          and instantly compare it to the blockchain record.
        </p>

        <div
          className="upload-zone"
          onClick={() => fileInputRef.current.click()}
          onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="upload-icon">🔍</div>
          <p><strong>Click to select</strong> or drag &amp; drop a logo file</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFileChange(e.target.files[0])}
        />

        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="Uploaded logo" />
          </div>
        )}

        {fileHash && (
          <div style={{ marginTop: "1rem" }}>
            <label style={{ fontWeight: 600, fontSize: "0.875rem", display: "block", marginBottom: "0.375rem" }}>
              Computed Hash
            </label>
            <div className="hash-display">{fileHash}</div>
          </div>
        )}

        {isHashing && (
          <div className="alert alert-info" style={{ marginTop: "1rem" }}>
            <span className="alert-icon">⏳</span>
            <div className="alert-body"><div className="alert-desc">Computing hash and verifying…</div></div>
          </div>
        )}
      </div>

      {/* ── OR separator ── */}
      <div className="or-separator">OR</div>

      {/* ── Method 2: Paste hash ── */}
      <div className="card">
        <h3>Method 2 — Paste a Hash</h3>
        <p style={{ marginBottom: "1rem" }}>
          Already have a SHA-256 hash? Paste it below to verify directly.
        </p>
        <form onSubmit={handleHashSubmit}>
          <div className="form-group">
            <label htmlFor="manualHash">SHA-256 Hash (hex)</label>
            <input
              id="manualHash"
              type="text"
              placeholder="0x6758a9d1..."
              value={manualHash}
              onChange={(e) => setManualHash(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
            />
            <span className="input-hint">With or without the 0x prefix.</span>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isVerifying}
          >
            {isVerifying ? <><span className="spinner" /> Verifying…</> : "Verify Hash"}
          </button>
        </form>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <div className="alert-body">
            <div className="alert-title">Could Not Verify</div>
            <div className="alert-desc">{error}</div>
          </div>
        </div>
      )}

      {/* ── Verification Result ── */}
      {result && (
        <VerificationResult result={result} />
      )}
    </div>
  );
}

function VerificationResult({ result }) {
  const { authentic, metadata } = result;

  if (authentic) {
    return (
      <div className="alert alert-success" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span className="alert-icon" style={{ fontSize: "2rem" }}>✅</span>
          <div>
            <div className="alert-title" style={{ fontSize: "1.2rem" }}>
              Logo Verified — This is the Authentic ALU Logo
            </div>
            <div className="alert-desc">
              The file you uploaded matches the logo permanently recorded on the blockchain.
              It has not been modified or tampered with.
            </div>
          </div>
        </div>

        {metadata && (
          <>
            <hr className="divider" style={{ margin: "1rem 0" }} />
            <table className="meta-table">
              <tbody>
                <tr>
                  <th>Asset Name</th>
                  <td>{metadata.assetName}</td>
                </tr>
                <tr>
                  <th>File Type</th>
                  <td>{metadata.fileType}</td>
                </tr>
                <tr>
                  <th>Registered By</th>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {shortenAddress(metadata.registrar)}
                  </td>
                </tr>
                <tr>
                  <th>Registration Date</th>
                  <td>{metadata.timestamp}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="alert alert-danger" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <span className="alert-icon" style={{ fontSize: "2rem" }}>⚠️</span>
        <div>
          <div className="alert-title" style={{ fontSize: "1.2rem" }}>
            Warning — This Logo Does Not Match
          </div>
          <div className="alert-desc">
            The file you uploaded does <strong>not</strong> match the official ALU logo
            on the blockchain. This logo may have been modified, resized, or is simply
            not the authentic ALU logo. Do not use it in official communications.
          </div>
        </div>
      </div>
    </div>
  );
}

