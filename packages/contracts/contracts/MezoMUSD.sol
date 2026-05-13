// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  MezoMUSD
 * @notice Bitcoin-backed stablecoin (MUSD) minted through MezoBorrow.
 *         Implements the ERC-20 standard without external dependencies.
 *
 * Flow:  BTC deposited as collateral → MezoBorrow mints MUSD to the user
 *        User repays MUSD            → MezoBorrow burns MUSD, releases BTC
 */
contract MezoMUSD {

    // ─── ERC-20 metadata ─────────────────────────────────────────────────────
    string  public constant name     = "Mezo USD";
    string  public constant symbol   = "MUSD";
    uint8   public constant decimals = 18;

    // ─── ERC-20 state ─────────────────────────────────────────────────────────
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ─── Access control ───────────────────────────────────────────────────────
    address public immutable owner;
    address public borrowVault;           // set once after MezoBorrow deploy

    // ─── Events ───────────────────────────────────────────────────────────────
    event Transfer(address indexed from,  address indexed to,      uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event BorrowVaultSet(address vault);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner()  { require(msg.sender == owner,       "MUSD: not owner"); _; }
    modifier onlyVault()  { require(msg.sender == borrowVault, "MUSD: not vault"); _; }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() { owner = msg.sender; }

    // ─── One-time vault assignment ────────────────────────────────────────────
    function setBorrowVault(address _vault) external onlyOwner {
        require(_vault != address(0), "zero address");
        borrowVault = _vault;
        emit BorrowVaultSet(_vault);
    }

    // ─── ERC-20 standard functions ────────────────────────────────────────────
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "zero address");
        require(balanceOf[msg.sender] >= amount, "MUSD: insufficient balance");
        unchecked {
            balanceOf[msg.sender] -= amount;
            balanceOf[to]         += amount;
        }
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(to != address(0), "zero address");
        require(balanceOf[from] >= amount,            "MUSD: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "MUSD: allowance exceeded");
        unchecked {
            allowance[from][msg.sender] -= amount;
            balanceOf[from]             -= amount;
            balanceOf[to]               += amount;
        }
        emit Transfer(from, to, amount);
        return true;
    }

    // ─── Vault-only mint / burn ───────────────────────────────────────────────
    function mint(address to, uint256 amount) external onlyVault {
        require(to != address(0), "zero address");
        unchecked {
            totalSupply    += amount;
            balanceOf[to]  += amount;
        }
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyVault {
        require(balanceOf[from] >= amount, "MUSD: insufficient balance");
        unchecked {
            totalSupply      -= amount;
            balanceOf[from]  -= amount;
        }
        emit Transfer(from, address(0), amount);
    }
}
