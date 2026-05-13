import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// This pulls from your .env file
const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
const RPC_URL = "https://rpc.test.mezo.org"; 

const VaultStatus = () => {
  const [balance, setBalance] = useState("Loading...");
  const [error, setError] = useState(null);

  const fetchVaultData = async () => {
    try {
      // 1. Setup Provider
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // 2. Minimal ABI for the check
      const abi = ["function totalAssets() view returns (uint256)"];
      
      // 3. Connect to Contract
      const contract = new ethers.Contract(VAULT_ADDRESS, abi, provider);
      
      // 4. Fetch Balance
      const total = await contract.totalAssets();
      setBalance(ethers.formatEther(total));
    } catch (err) {
      console.error(err);
      setError("Could not connect to Vault");
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
      <h3>MezoVault Live Status</h3>
      <p><strong>Address:</strong> {VAULT_ADDRESS}</p>
      <p><strong>Total Assets:</strong> {balance} BTC/ETH</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={fetchVaultData}>Refresh</button>
    </div>
  );
};

export default VaultStatus;