// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MezoVault
 * @dev A secure vault for managing deposits and withdrawals on the Mezo Network.
 */
contract MezoVault {
    address public immutable owner;
    bool private locked;

    mapping(address => uint256) private _balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    // Reentrancy Guard modifier
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Allows users to deposit Mezo BTC/ETH into the vault.
     */
    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        
        _balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Allows users to withdraw their deposited funds.
     * Uses the secure .call method and Checks-Effects-Interactions pattern.
     */
    function withdraw(uint256 amount) public nonReentrant {
        require(_balances[msg.sender] >= amount, "Insufficient balance");

        // Effect: Update state before interaction
        _balances[msg.sender] -= amount;

        // Interaction: Send funds
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Returns the balance of a specific user.
     */
    function balanceOf(address user) public view returns (uint256) {
        return _balances[user];
    }

    /**
     * @dev Returns the total balance held by the contract.
     */
    function totalAssets() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Emergency function for the owner to recover funds sent to the contract by mistake.
     */
    function sweep() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Sweep failed");
    }
}