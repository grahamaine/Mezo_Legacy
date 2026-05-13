import pkg from "hardhat";
const { ethers } = pkg;
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("================================================");
  console.log("Mezo Legacy Contract Deployer");
  console.log("================================================");
  console.log("Network  :", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer :", deployer.address);
  console.log("Balance  :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("================================================\n");

  // ── Deploy MezoVault ──────────────────────────────────────
  console.log("Deploying MezoVault...");
  const MezoVault = await ethers.getContractFactory("MezoVault");
  const vault = await MezoVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ MezoVault deployed to:", vaultAddress);

  // ── Deploy MezoStaking ────────────────────────────────────
  console.log("\nDeploying MezoStaking...");
  const MezoStaking = await ethers.getContractFactory("MezoStaking");
  const staking = await MezoStaking.deploy();
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ MezoStaking deployed to:", stakingAddress);

  // ── Save addresses ────────────────────────────────────────
  const deployedAddresses = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    contracts: {
      MezoVault: vaultAddress,
      MezoStaking: stakingAddress,
    },
  };

  const outputPath = path.join(__dirname, "../deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));

  console.log("\n================================================");
  console.log("Deployment complete. Update your .env files:");
  console.log("VITE_VAULT_ADDRESS=" + vaultAddress);
  console.log("VITE_STAKING_ADDRESS=" + stakingAddress);
  console.log("================================================\n");
  console.log("Addresses saved to: packages/contracts/deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
