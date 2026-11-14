import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import ALULogoTokenABI from "../abis/ALULogoToken.json";
import { CONTRACT_ADDRESSES, HARDHAT_NETWORK } from "../constants.js";
import { shortenAddress, formatTokenAmount } from "../utils/hash.js";

/**
 * useWallet — shared React hook for wallet connection and state.
 *
 * Returns:
 *  - address: connected wallet address (null if not connected)
 *  - shortAddress: shortened version for display
 *  - provider: ethers BrowserProvider
 *  - signer: ethers Signer (for write transactions)
 *  - alutBalance: human-readable ALUT balance string
 *  - isOwner: whether connected wallet is the ALULogoToken owner
 *  - connectWallet(): async function to trigger MetaMask connection
 *  - disconnectWallet(): resets all state
 *  - error: any connection error message
 *  - isConnecting: loading state
 */
export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [alutBalance, setAlutBalance] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchBalanceAndOwner = useCallback(async (addr, prov) => {
    try {
      const tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.ALULogoToken,
        ALULogoTokenABI,
        prov
      );
      const [rawBalance, ownerAddr] = await Promise.all([
        tokenContract.balanceOf(addr),
        tokenContract.owner(),
      ]);
      setAlutBalance(formatTokenAmount(rawBalance));
      setIsOwner(ownerAddr.toLowerCase() === addr.toLowerCase());
    } catch (err) {
      // Contract may not be deployed yet — show placeholder
      setAlutBalance("N/A");
      setIsOwner(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setError(null);

    if (!window.ethereum) {
      setError(
        "No Web3 wallet detected. Please install MetaMask from metamask.io and reload the page."
      );
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const prov = new ethers.BrowserProvider(window.ethereum);
      const sign = await prov.getSigner();
      const addr = await sign.getAddress();

      setProvider(prov);
      setSigner(sign);
      setAddress(addr);

      await fetchBalanceAndOwner(addr, prov);
    } catch (err) {
      if (err.code === 4001) {
        setError("Wallet connection rejected. Please approve the connection in MetaMask.");
      } else {
        setError("Failed to connect wallet: " + err.message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalanceAndOwner]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setAlutBalance("0");
    setIsOwner(false);
    setError(null);
  }, []);

  // Refresh balance (called after transactions)
  const refreshBalance = useCallback(async () => {
    if (address && provider) {
      await fetchBalanceAndOwner(address, provider);
    }
  }, [address, provider, fetchBalanceAndOwner]);

  // Listen for account and network changes in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        // User switched accounts — reconnect
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Reload on network switch to reset all state safely
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  return {
    address,
    shortAddress: shortenAddress(address),
    provider,
    signer,
    alutBalance,
    isOwner,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    error,
    isConnecting,
  };
}

