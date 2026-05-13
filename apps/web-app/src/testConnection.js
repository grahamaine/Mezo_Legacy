import { ethers } from "ethers";

// These match your .env variables
const VAULT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL; 

export async function testVaultConnection() {
    try {
        // 1. Connect to the network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        
        // 2. Minimal ABI (only need the function we are testing)
        const minABI = ["function totalAssets() view returns (uint256)"];
        
        // 3. Create contract instance
        const contract = new ethers.Contract(VAULT_ADDRESS, minABI, provider);
        
        // 4. Call the function
        const total = await contract.totalAssets();
        
        console.log("✅ Success! Connected to MezoVault");
        console.log("Vault Address:", VAULT_ADDRESS);
        console.log("Total Assets in Vault:", ethers.formatEther(total), "BTC/ETH");
        return true;
    } catch (error) {
        console.error("❌ Connection Failed!");
        console.error("Error details:", error.message);
        return false;
    }
}