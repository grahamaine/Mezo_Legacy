import pkg from "hardhat";
const { ethers } = pkg;
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = await ethers.provider.getNetwork();

  console.log("================================================");
  console.log("Mezo Legacy Contract Deployer");
  console.log("================================================");
  console.log("Network  :", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer :", deployer.address);
  console.log("Balance  :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BTC");
  console.log("================================================\n");

  // ── 1. MezoVault ─────────────────────────────────────────────────────────
  console.log("1/4  Deploying MezoVault…");
  const MezoVault = await ethers.getContractFactory("MezoVault");
  const vault     = await MezoVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("     ✅  MezoVault   →", vaultAddress);

  // ── 2. MezoStaking ───────────────────────────────────────────────────────
  console.log("2/4  Deploying MezoStaking…");
  const MezoStaking = await ethers.getContractFactory("MezoStaking");
  const staking     = await MezoStaking.deploy();
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("     ✅  MezoStaking →", stakingAddress);

  // ── 3. MezoMUSD (ERC-20 token, minted by MezoBorrow) ─────────────────────
  console.log("3/4  Deploying MezoMUSD…");
  const MezoMUSD = await ethers.getContractFactory("MezoMUSD");
  const musd     = await MezoMUSD.deploy();
  await musd.waitForDeployment();
  const musdAddress = await musd.getAddress();
  console.log("     ✅  MezoMUSD    →", musdAddress);

  // ── 4. MezoBorrow (references MezoMUSD) ──────────────────────────────────
  console.log("4/4  Deploying MezoBorrow…");
  const MezoBorrow = await ethers.getContractFactory("MezoBorrow");
  const borrow     = await MezoBorrow.deploy(musdAddress);
  await borrow.waitForDeployment();
  const borrowAddress = await borrow.getAddress();
  console.log("     ✅  MezoBorrow  →", borrowAddress);

  // ── 5. Wire: grant MezoBorrow the vault role in MezoMUSD ─────────────────
  console.log("\n     Wiring: MezoMUSD.setBorrowVault(MezoBorrow)…");
  const tx = await musd.setBorrowVault(borrowAddress);
  await tx.wait();
  console.log("     ✅  Done — MezoBorrow can now mint/burn MUSD");

  // ── Persist addresses ────────────────────────────────────────────────────
  const deployed = {
    network:    network.name,
    chainId:    network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    contracts: {
      MezoVault:   vaultAddress,
      MezoStaking: stakingAddress,
      MezoMUSD:    musdAddress,
      MezoBorrow:  borrowAddress,
    },
  };

  const outputPath = path.join(__dirname, "../deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployed, null, 2));

  console.log("\n================================================");
  console.log("Deployment complete. Add to apps/web-app/.env:");
  console.log("================================================");
  console.log("VITE_VAULT_ADDRESS="   + vaultAddress);
  console.log("VITE_STAKING_ADDRESS=" + stakingAddress);
  console.log("VITE_MUSD_ADDRESS="    + musdAddress);
  console.log("VITE_BORROW_ADDRESS="  + borrowAddress);
  console.log("================================================");
  console.log("Saved to: packages/contracts/deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
