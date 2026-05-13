import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// ─── MezoVault Tests ──────────────────────────────────────────────────────────

describe("MezoVault", function () {
  let vault: any;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const VaultFactory = await ethers.getContractFactory("MezoVault");
    vault = await VaultFactory.deploy();
    await vault.waitForDeployment();
  });

  // ── deployment ────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("starts with zero total assets", async function () {
      expect(await vault.totalAssets()).to.equal(0n);
    });
  });

  // ── deposit ───────────────────────────────────────────────────────────────

  describe("deposit()", function () {
    it("records the deposit and increments balance", async function () {
      const amount = ethers.parseEther("0.5");
      await vault.connect(user1).deposit({ value: amount });
      expect(await vault.balanceOf(user1.address)).to.equal(amount);
    });

    it("increments totalAssets by the deposited amount", async function () {
      const amount = ethers.parseEther("1.0");
      await vault.connect(user1).deposit({ value: amount });
      expect(await vault.totalAssets()).to.equal(amount);
    });

    it("emits a Deposited event", async function () {
      const amount = ethers.parseEther("0.25");
      await expect(vault.connect(user1).deposit({ value: amount }))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, amount);
    });

    it("reverts on zero-value deposit", async function () {
      await expect(vault.connect(user1).deposit({ value: 0n }))
        .to.be.revertedWith("Deposit amount must be greater than zero");
    });

    it("tracks multiple depositors independently", async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("1.0") });
      await vault.connect(user2).deposit({ value: ethers.parseEther("2.0") });
      expect(await vault.balanceOf(user1.address)).to.equal(ethers.parseEther("1.0"));
      expect(await vault.balanceOf(user2.address)).to.equal(ethers.parseEther("2.0"));
      expect(await vault.totalAssets()).to.equal(ethers.parseEther("3.0"));
    });
  });

  // ── withdraw ──────────────────────────────────────────────────────────────

  describe("withdraw()", function () {
    const DEPOSIT = ethers.parseEther("1.0");

    beforeEach(async function () {
      await vault.connect(user1).deposit({ value: DEPOSIT });
    });

    it("allows full withdrawal of deposited amount", async function () {
      await vault.connect(user1).withdraw(DEPOSIT);
      expect(await vault.balanceOf(user1.address)).to.equal(0n);
    });

    it("allows partial withdrawal", async function () {
      const half = DEPOSIT / 2n;
      await vault.connect(user1).withdraw(half);
      expect(await vault.balanceOf(user1.address)).to.equal(half);
    });

    it("decrements totalAssets after withdrawal", async function () {
      const half = DEPOSIT / 2n;
      await vault.connect(user1).withdraw(half);
      expect(await vault.totalAssets()).to.equal(half);
    });

    it("emits a Withdrawn event", async function () {
      await expect(vault.connect(user1).withdraw(DEPOSIT))
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, DEPOSIT);
    });

    it("reverts when withdrawing more than balance", async function () {
      const tooMuch = DEPOSIT + 1n;
      await expect(vault.connect(user1).withdraw(tooMuch))
        .to.be.revertedWith("Insufficient balance");
    });

    it("reverts if user has no balance", async function () {
      await expect(vault.connect(user2).withdraw(ethers.parseEther("0.1")))
        .to.be.revertedWith("Insufficient balance");
    });

    it("actually transfers ETH back to the user", async function () {
      const before = await ethers.provider.getBalance(user1.address);
      const tx     = await vault.connect(user1).withdraw(DEPOSIT);
      const receipt = await tx.wait();
      const gas    = receipt!.gasUsed * receipt!.gasPrice;
      const after  = await ethers.provider.getBalance(user1.address);
      // user1 should have received DEPOSIT minus gas
      expect(after).to.be.closeTo(before + DEPOSIT - gas, ethers.parseEther("0.001"));
    });
  });

  // ── balanceOf ─────────────────────────────────────────────────────────────

  describe("balanceOf()", function () {
    it("returns zero for unknown address", async function () {
      expect(await vault.balanceOf(user2.address)).to.equal(0n);
    });

    it("increases after deposit and decreases after withdraw", async function () {
      const amt = ethers.parseEther("0.3");
      await vault.connect(user1).deposit({ value: amt });
      expect(await vault.balanceOf(user1.address)).to.equal(amt);
      await vault.connect(user1).withdraw(amt);
      expect(await vault.balanceOf(user1.address)).to.equal(0n);
    });
  });

  // ── sweep ─────────────────────────────────────────────────────────────────

  describe("sweep()", function () {
    it("reverts when called by non-owner", async function () {
      await vault.connect(user1).deposit({ value: ethers.parseEther("1.0") });
      await expect(vault.connect(user1).sweep())
        .to.be.revertedWith("Caller is not the owner");
    });
  });
});

// ─── MezoStaking Tests ────────────────────────────────────────────────────────

describe("MezoStaking", function () {
  let staking: any;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const StakingFactory = await ethers.getContractFactory("MezoStaking");
    staking = await StakingFactory.deploy();
    await staking.waitForDeployment();
  });

  // ── deployment ────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      expect(await staking.owner()).to.equal(owner.address);
    });

    it("starts with zero totalStaked", async function () {
      expect(await staking.totalStaked()).to.equal(0n);
    });
  });

  // ── stake ─────────────────────────────────────────────────────────────────

  describe("stake()", function () {
    it("records the staked balance for the caller", async function () {
      const amount = ethers.parseEther("0.5");
      await staking.connect(user1).stake({ value: amount });
      expect(await staking.getStakedBalance(user1.address)).to.equal(amount);
    });

    it("increments totalStaked", async function () {
      const amount = ethers.parseEther("1.0");
      await staking.connect(user1).stake({ value: amount });
      expect(await staking.totalStaked()).to.equal(amount);
    });

    it("emits a Staked event", async function () {
      const amount = ethers.parseEther("0.25");
      await expect(staking.connect(user1).stake({ value: amount }))
        .to.emit(staking, "Staked")
        .withArgs(user1.address, amount);
    });

    it("reverts on zero-value stake", async function () {
      await expect(staking.connect(user1).stake({ value: 0n }))
        .to.be.revertedWith("Stake amount must be greater than zero");
    });

    it("accumulates multiple stakes from the same user", async function () {
      await staking.connect(user1).stake({ value: ethers.parseEther("0.5") });
      await staking.connect(user1).stake({ value: ethers.parseEther("0.5") });
      expect(await staking.getStakedBalance(user1.address)).to.equal(ethers.parseEther("1.0"));
    });

    it("tracks multiple stakers independently", async function () {
      await staking.connect(user1).stake({ value: ethers.parseEther("1.0") });
      await staking.connect(user2).stake({ value: ethers.parseEther("2.0") });
      expect(await staking.getStakedBalance(user1.address)).to.equal(ethers.parseEther("1.0"));
      expect(await staking.getStakedBalance(user2.address)).to.equal(ethers.parseEther("2.0"));
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("3.0"));
    });
  });

  // ── withdraw ──────────────────────────────────────────────────────────────

  describe("withdraw()", function () {
    const STAKE_AMT = ethers.parseEther("1.0");

    beforeEach(async function () {
      await staking.connect(user1).stake({ value: STAKE_AMT });
    });

    it("reduces staked balance after full withdrawal", async function () {
      await staking.connect(user1).withdraw(STAKE_AMT);
      expect(await staking.getStakedBalance(user1.address)).to.equal(0n);
    });

    it("allows partial withdrawal", async function () {
      const half = STAKE_AMT / 2n;
      await staking.connect(user1).withdraw(half);
      expect(await staking.getStakedBalance(user1.address)).to.equal(half);
    });

    it("decrements totalStaked after withdrawal", async function () {
      await staking.connect(user1).withdraw(STAKE_AMT);
      expect(await staking.totalStaked()).to.equal(0n);
    });

    it("emits a Withdrawn event", async function () {
      await expect(staking.connect(user1).withdraw(STAKE_AMT))
        .to.emit(staking, "Withdrawn")
        .withArgs(user1.address, STAKE_AMT);
    });

    it("reverts when withdrawing more than staked", async function () {
      await expect(staking.connect(user1).withdraw(STAKE_AMT + 1n))
        .to.be.revertedWith("Insufficient staked balance");
    });

    it("reverts if user has nothing staked", async function () {
      await expect(staking.connect(user2).withdraw(ethers.parseEther("0.1")))
        .to.be.revertedWith("Insufficient staked balance");
    });

    it("reverts on zero amount", async function () {
      await expect(staking.connect(user1).withdraw(0n))
        .to.be.revertedWith("Amount must be greater than zero");
    });

    it("transfers ETH back to the staker", async function () {
      const before  = await ethers.provider.getBalance(user1.address);
      const tx      = await staking.connect(user1).withdraw(STAKE_AMT);
      const receipt = await tx.wait();
      const gas     = receipt!.gasUsed * receipt!.gasPrice;
      const after   = await ethers.provider.getBalance(user1.address);
      expect(after).to.be.closeTo(before + STAKE_AMT - gas, ethers.parseEther("0.001"));
    });
  });

  // ── getStakedBalance ──────────────────────────────────────────────────────

  describe("getStakedBalance()", function () {
    it("returns zero for address with no stake", async function () {
      expect(await staking.getStakedBalance(user2.address)).to.equal(0n);
    });
  });

  // ── receive() guard ───────────────────────────────────────────────────────

  describe("receive() — plain ETH transfer rejection", function () {
    it("reverts direct ETH transfer (use stake() instead)", async function () {
      await expect(
        user1.sendTransaction({ to: await staking.getAddress(), value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Use stake() to deposit");
    });
  });

  // ── sweep ─────────────────────────────────────────────────────────────────

  describe("sweep()", function () {
    it("reverts when called by non-owner", async function () {
      await staking.connect(user1).stake({ value: ethers.parseEther("1.0") });
      await expect(staking.connect(user1).sweep())
        .to.be.revertedWith("Caller is not the owner");
    });

    it("reverts when there is no surplus", async function () {
      // All ETH is from legitimate stakes — no surplus
      await staking.connect(user1).stake({ value: ethers.parseEther("1.0") });
      await expect(staking.connect(owner).sweep())
        .to.be.revertedWith("No surplus to sweep");
    });
  });
});
