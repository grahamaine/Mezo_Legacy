// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MezoKYB
 * @dev On-chain KYB (Know Your Business) registry for the Mezo Network.
 *
 *      Privacy model: only the keccak256 hash of the application data is
 *      stored on-chain. The raw form data lives off-chain (IPFS / backend).
 *      The hash acts as a tamper-evident receipt so the applicant can prove
 *      they submitted a specific application at a specific block.
 *
 * ABI matches:
 *   - submitKYB(bytes32 applicationHash)      nonpayable
 *   - isVerified(address user)                view → bool
 *   - getStatus(address user)                 view → uint8  (Status enum)
 *   - getApplication(address user)            view → (bytes32, uint256, uint8)
 *   - approveKYB(address applicant)           nonpayable  [owner only]
 *   - rejectKYB(address applicant, string)    nonpayable  [owner only]
 *   - revokeKYB(address applicant)            nonpayable  [owner only]
 *
 * Events:
 *   - KYBSubmitted(address indexed, bytes32, uint256)
 *   - KYBApproved(address indexed, uint256)
 *   - KYBRejected(address indexed, string)
 *   - KYBRevoked(address indexed)
 */
contract MezoKYB {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum Status { None, Pending, Approved, Rejected }

    struct Application {
        bytes32 dataHash;    // keccak256 of off-chain application JSON
        uint256 submittedAt; // block.timestamp of submission
        Status  status;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public immutable owner;
    mapping(address => Application) private _applications;
    uint256 public totalSubmissions;
    uint256 public totalApproved;

    // ─── Events ───────────────────────────────────────────────────────────────

    event KYBSubmitted(address indexed applicant, bytes32 applicationHash, uint256 timestamp);
    event KYBApproved(address indexed applicant, uint256 timestamp);
    event KYBRejected(address indexed applicant, string reason);
    event KYBRevoked(address indexed applicant);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "MezoKYB: caller is not owner");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Applicant Functions ──────────────────────────────────────────────────

    /**
     * @dev Submit a KYB application. Stores only the hash of the off-chain data.
     * @param applicationHash keccak256(abi.encode(businessName, regNumber, ownerAddress, timestamp))
     *                        computed client-side before calling this function.
     *
     * Re-submission is allowed when status is None or Rejected (re-apply after rejection).
     * Pending applications cannot be re-submitted until reviewed.
     */
    function submitKYB(bytes32 applicationHash) external {
        Status current = _applications[msg.sender].status;
        require(current != Status.Pending,  "MezoKYB: application already pending review");
        require(current != Status.Approved, "MezoKYB: wallet is already KYB verified");
        require(applicationHash != bytes32(0), "MezoKYB: invalid application hash");

        _applications[msg.sender] = Application({
            dataHash:    applicationHash,
            submittedAt: block.timestamp,
            status:      Status.Pending
        });

        totalSubmissions += 1;

        emit KYBSubmitted(msg.sender, applicationHash, block.timestamp);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /**
     * @dev Returns true if the address has been approved.
     */
    function isVerified(address user) external view returns (bool) {
        return _applications[user].status == Status.Approved;
    }

    /**
     * @dev Returns the raw status enum value (0=None,1=Pending,2=Approved,3=Rejected).
     */
    function getStatus(address user) external view returns (Status) {
        return _applications[user].status;
    }

    /**
     * @dev Returns full application details for a given address.
     */
    function getApplication(address user)
        external view
        returns (bytes32 dataHash, uint256 submittedAt, Status status)
    {
        Application storage app = _applications[user];
        return (app.dataHash, app.submittedAt, app.status);
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    /**
     * @dev Approve a pending application.
     */
    function approveKYB(address applicant) external onlyOwner {
        require(_applications[applicant].status == Status.Pending, "MezoKYB: not pending");
        _applications[applicant].status = Status.Approved;
        totalApproved += 1;
        emit KYBApproved(applicant, block.timestamp);
    }

    /**
     * @dev Reject a pending application with a reason string.
     */
    function rejectKYB(address applicant, string calldata reason) external onlyOwner {
        require(_applications[applicant].status == Status.Pending, "MezoKYB: not pending");
        _applications[applicant].status = Status.Rejected;
        emit KYBRejected(applicant, reason);
    }

    /**
     * @dev Revoke an approved KYB (compliance action — e.g. sanctions match).
     */
    function revokeKYB(address applicant) external onlyOwner {
        require(_applications[applicant].status == Status.Approved, "MezoKYB: not approved");
        _applications[applicant].status = Status.None;
        if (totalApproved > 0) totalApproved -= 1;
        emit KYBRevoked(applicant);
    }
}
