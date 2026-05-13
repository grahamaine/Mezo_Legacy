// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MezoStaking
 * @dev Staking contract for the Mezo Network.
 *      Users stake native BTC/ETH, earn rewards, and withdraw their stake.
 *
 * ABI matches:
 *   - stake()                              payable
 *   - withdraw(uint256 amount)             nonpayable
 *   - getStakedBalance(address user)       view → uint256
 *   - event Staked(address indexed user, uint256 amount)
 *   - event Withdrawn(address indexed user, uint256 amount)
 */
contract MezoStaking {

    // ─── State ────────────────────────────────────────────────────────────────

    address public immutable owner;
    bool    private locked;

    mapping(address => uint256) private _stakedBalances;
    uint256 public totalStaked;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────────────────────

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

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /**
     * @dev Stake native tokens (BTC/ETH) into the contract.
     *      msg.value is the amount being staked.
     */
    function stake() external payable {
        require(msg.value > 0, "Stake amount must be greater than zero");

        _stakedBalances[msg.sender] += msg.value;
        totalStaked += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw a specified amount of staked tokens.
     * @param amount The amount to withdraw (in wei).
     *
     * Uses Checks-Effects-Interactions + reentrancy guard.
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(_stakedBalances[msg.sender] >= amount, "Insufficient staked balance");

        // Effects — update state before interaction
        _stakedBalances[msg.sender] -= amount;
        totalStaked -= amount;

        // Interaction — send funds back to caller
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Returns the staked balance of a specific user.
     * @param user The address to query.
     * @return The staked balance in wei.
     */
    function getStakedBalance(address user) external view returns (uint256) {
        return _stakedBalances[user];
    }

    // ─── Owner Functions ──────────────────────────────────────────────────────

    /**
     * @dev Emergency sweep — owner can recover any surplus ETH
     *      (i.e. ETH sent directly to contract outside of stake()).
     *      Does NOT touch staked user funds.
     */
    function sweep() external onlyOwner {
        uint256 surplus = address(this).balance - totalStaked;
        require(surplus > 0, "No surplus to sweep");
        (bool success, ) = owner.call{value: surplus}("");
        require(success, "Sweep failed");
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────

    /// @dev Reject plain ETH transfers — users must call stake() explicitly.
    receive() external payable {
        revert("Use stake() to deposit");
    }
}
