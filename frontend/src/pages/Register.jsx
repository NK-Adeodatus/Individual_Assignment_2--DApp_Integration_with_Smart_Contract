import { useState, useRef } from "react";
import { ethers } from "ethers";
import { hashFile } from "../utils/hash.js";
import ALUAssetRegistryABI from "../abis/ALUAssetRegistry.json";
import { CONTRACT_ADDRESSES } from "../constants.js";

export default function Register({ wallet }) {
  const { address, signer } = wallet;

  // File and hash state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [contentHash, setContentHash] = useState("");
  const [isHashing, setIsHashing]     = useState(false);

  // Form state
  const [assetName, setAssetName] = useState("");
  const [fileType, setFileType]   = useState("");

  // Transaction state
  const [isTxPending, setIsTxPending] = useState(false);
  const [successTokenId, setSuccessTokenId] = useState(null);
  const [txError, setTxError]             = useState(null);

  const fileInputRef = useRef(null);

  // ── File selection & hashing ──────────────────────────────────────────────
  async function handleFileChange(file) {
    if (!file) return;
    setSelectedFile(file);
    setSuccessTokenId(null);
    setTxError(null);
    setContentHash("");
    setFileType(file.type || "");

    // Show image preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Hash in browser
    setIsHashing(true);
    try {
      const hash = await hashFile(file);
      setContentHash(hash);
    } catch (err) {
      setTxError("Failed to hash the file: " + err.message);
    } finally {
      setIsHashing(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

  // ── Asset registration ────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setTxError(null);
    setSuccessTokenId(null);

    if (!assetName.trim()) { setTxError("Please enter an asset name."); return; }
    if (!contentHash)      { setTxError("Please select a file first."); return; }

    setIsTxPending(true);
    try {
      const registry = new ethers.Contract(
        CONTRACT_ADDRESSES.ALUAssetRegistry,
        ALUAssetRegistryABI,
        signer
      );

      // This call opens MetaMask for the user to sign
      const tx = await registry.registerAsset(
        assetName.trim(),
        fileType.trim() || "unknown",
        contentHash
      );

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      // Parse the AssetRegistered event to get the tokenId
      const event = receipt.logs
        .map((log) => {
          try { return registry.interface.parseLog(log); } catch { return null; }
        })
        .find((e) => e && e.name === "AssetRegistered");

      const tokenId = event ? event.args.tokenId.toString() : "?";
      setSuccessTokenId(tokenId);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setContentHash("");
      setAssetName("");
      setFileType("");
    } catch (err) {
      if (err.message?.includes("Asset hash already registered")) {
        setTxError(
          "This file has already been registered on the blockchain. Each logo can only be registered once."
        );
      } else if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setTxError("Transaction cancelled — you rejected the wallet signature request.");
      } else {
        setTxError("Transaction failed: " + (err.reason || err.message));
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
          <h1>Register a Logo</h1>
          <p>Upload a logo file and register its hash permanently on the blockchain as an NFT.</p>
        </div>
        <div className="wallet-gate card">
          <div className="gate-icon">🔒</div>
          <h2>Wallet Required</h2>
          <p>You need to connect a Web3 wallet to register assets. Click <strong>Connect Wallet</strong> in the navigation bar.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Register a Logo</h1>
        <p>
          Upload a logo image to hash it in your browser and register it
          permanently on the blockchain as an NFT.
        </p>
      </div>

      {/* Success banner */}
      {successTokenId && (
        <div className="alert alert-success">
          <span className="alert-icon">🎉</span>
          <div className="alert-body">
            <div className="alert-title">Logo Registered Successfully!</div>
            <div className="alert-desc">
              Your logo has been permanently recorded on the blockchain.{" "}
              <strong>Token ID: {successTokenId}</strong>. You can now use this
              token ID on the Verify page to authenticate any copy of this logo.
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {txError && (
        <div className="alert alert-danger">
          <span className="alert-icon">❌</span>
          <div className="alert-body">
            <div className="alert-title">Registration Failed</div>
            <div className="alert-desc">{txError}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleRegister}>
        {/* Step 1: File upload */}
        <div className="card">
          <h3>Step 1 — Select Logo File</h3>
          <p style={{ marginBottom: "1rem" }}>
            Your file is hashed entirely in this browser — it is never uploaded to any server.
          </p>

          <div
            className="upload-zone"
            onClick={() => fileInputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="upload-icon">🖼️</div>
            <p>
              <strong>Click to select</strong> or drag &amp; drop an image file here
            </p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              PNG, JPG, SVG, or any image format
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e.target.files[0])}
          />

          {/* Image preview */}
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Selected logo preview" />
              <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                {selectedFile?.name}
              </p>
            </div>
          )}

          {/* Hash result */}
          {isHashing && (
            <div className="alert alert-info" style={{ marginTop: "1rem" }}>
              <span className="alert-icon">⏳</span>
              <div className="alert-body">
                <div className="alert-desc">Computing SHA-256 hash…</div>
              </div>
            </div>
          )}

          {contentHash && !isHashing && (
            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontWeight: 600, fontSize: "0.875rem", display: "block", marginBottom: "0.375rem" }}>
                SHA-256 Hash (bytes32)
              </label>
              <div className="hash-display">{contentHash}</div>
              <p className="input-hint" style={{ marginTop: "0.25rem" }}>
                This is the cryptographic fingerprint of your file. It will be stored on the blockchain.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Metadata form */}
        <div className="card">
          <h3>Step 2 — Asset Details</h3>

          <div className="form-group">
            <label htmlFor="assetName">Asset Name *</label>
            <input
              id="assetName"
              type="text"
              placeholder="e.g. ALU Official Logo 2026"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fileType">File Type</label>
            <input
              id="fileType"
              type="text"
              placeholder="e.g. image/png"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            />
            <span className="input-hint">Auto-filled from the selected file. You may edit it.</span>
          </div>

          <div className="form-group">
            <label>Content Hash (auto-filled)</label>
            <div className="hash-display">
              {contentHash || "— select a file above to generate —"}
            </div>
          </div>
        </div>

        {/* Step 3: Submit */}
        <div className="card">
          <h3>Step 3 — Register on Blockchain</h3>
          <p style={{ marginBottom: "1rem" }}>
            Clicking the button below will open your wallet for transaction
            approval. You are agreeing to pay a small gas fee and permanently
            record this logo hash on the blockchain.
          </p>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isTxPending || isHashing || !contentHash}
          >
            {isTxPending ? (
              <><span className="spinner" /> Waiting for wallet approval…</>
            ) : (
              "Register Logo on Blockchain"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

