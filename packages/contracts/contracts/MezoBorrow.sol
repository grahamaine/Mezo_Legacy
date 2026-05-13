// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MezoMUSD.sol";

/**
 * @title  MezoBorrow
 * @notice Self-service Bitcoin borrowing vault.
 *
 *         Users deposit native BTC (gas token on Mezo) as collateral and mint
 *         MUSD at a fixed 1% annual rate. Positions remain fully self-custodied:
 *         users add collateral, repay, or close whenever they want.
 *
 * Collateral ratio:
 *   CR = (btcCollateral × btcPrice) / musdDebt × 100
 *   Minimum safe CR = 150 %  (i.e. max 66 % LTV)
 *
 * Interest:
 *   Simple annual interest: debt × 1% × (secondsElapsed / 365 days)
 *   Interest accrues on every state-changing call.
 *
 * Oracle:
 *   For the testnet demo the owner sets btcPriceUsd manually.
 *   Production would replace this with a Chainlink or Pyth price feed.
 */
contract MezoBorrow {

    // ─── Types ────────────────────────────────────────────────────────────────
    struct Position {
        uint256 btcCollateral;   // native BTC deposited, in wei (18 dp)
        uint256 musdDebt;        // MUSD outstanding, in wei (18 dp, $1 each)
        uint256 lastUpdate;      // unix timestamp of last interest accrual
    }

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant MIN_COLLATERAL_RATIO = 150;   // 150 %
    uint256 public constant BORROW_RATE_PCT      = 1;     // 1 % annual
    uint256 public constant SECONDS_PER_YEAR     = 365 days;

    // ─── State ────────────────────────────────────────────────────────────────
    MezoMUSD public immutable musd;
    address  public immutable owner;

    /// @dev BTC price in USD with 18 decimals (e.g. $97,500 → 97_500e18)
    uint256 public btcPriceUsd = 97_500e18;

    mapping(address => Position) private _positions;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Borrowed(address indexed user, uint256 btcCollateral, uint256 musdMinted);
    event Repaid(address indexed user, uint256 musdRepaid, uint256 btcReleased);
    event CollateralAdded(address indexed user, uint256 btcAdded);
    event PositionClosed(address indexed user, uint256 btcReturned, uint256 musdBurned);
    event PriceUpdated(uint256 newPrice);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _musd) {
        require(_musd != address(0), "zero address");
        musd  = MezoMUSD(_musd);
        owner = msg.sender;
    }

    // ─── Owner: price oracle update ───────────────────────────────────────────
    function setBtcPrice(uint256 _priceUsd18) external onlyOwner {
        require(_priceUsd18 > 0, "zero price");
        btcPriceUsd = _priceUsd18;
        emit PriceUpdated(_priceUsd18);
    }

    // ─── User: open / add to position ─────────────────────────────────────────
    /**
     * @notice Deposit BTC collateral and borrow MUSD in one transaction.
     * @param  musdAmount Amount of MUSD to mint (must satisfy MIN_COLLATERAL_RATIO).
     */
    function borrow(uint256 musdAmount) external payable {
        require(msg.value  > 0, "need BTC collateral");
        require(musdAmount > 0, "need MUSD amount");

        _accrueInterest(msg.sender);

        Position storage pos = _positions[msg.sender];
        pos.btcCollateral += msg.value;
        pos.musdDebt      += musdAmount;
        pos.lastUpdate     = block.timestamp;

        require(
            _collateralRatio(pos.btcCollateral, pos.musdDebt) >= MIN_COLLATERAL_RATIO,
            "MezoBorrow: under-collateralized"
        );

        musd.mint(msg.sender, musdAmount);
        emit Borrowed(msg.sender, msg.value, musdAmount);
    }

    /**
     * @notice Add extra BTC collateral to an existing position (improves health).
     */
    function addCollateral() external payable {
        require(msg.value > 0, "need BTC");
        _accrueInterest(msg.sender);
        _positions[msg.sender].btcCollateral += msg.value;
        emit CollateralAdded(msg.sender, msg.value);
    }

    // ─── User: reduce / close position ────────────────────────────────────────
    /**
     * @notice Repay `musdAmount` of MUSD debt.
     *         BTC is released proportionally to the debt cleared.
     */
    function repay(uint256 musdAmount) external {
        _accrueInterest(msg.sender);

        Position storage pos = _positions[msg.sender];
        require(pos.musdDebt > 0, "no debt");

        uint256 actualRepay = musdAmount > pos.musdDebt ? pos.musdDebt : musdAmount;

        // Proportional BTC release: btcReleased / totalCollateral = repaid / totalDebt
        uint256 btcRelease = pos.btcCollateral * actualRepay / pos.musdDebt;

        // Effects — update state before interaction (CEI)
        pos.musdDebt      -= actualRepay;
        pos.btcCollateral -= btcRelease;

        // Interactions
        musd.burn(msg.sender, actualRepay);

        (bool ok,) = msg.sender.call{value: btcRelease}("");
        require(ok, "BTC transfer failed");

        emit Repaid(msg.sender, actualRepay, btcRelease);
    }

    /**
     * @notice Close the entire position: repay all debt, receive all collateral.
     */
    function closePosition() external {
        _accrueInterest(msg.sender);

        Position storage pos = _positions[msg.sender];
        require(pos.btcCollateral > 0 || pos.musdDebt > 0, "no position");

        uint256 debt       = pos.musdDebt;
        uint256 collateral = pos.btcCollateral;

        // Effects
        pos.musdDebt      = 0;
        pos.btcCollateral = 0;
        pos.lastUpdate    = block.timestamp;

        // Interactions
        if (debt > 0) musd.burn(msg.sender, debt);

        if (collateral > 0) {
            (bool ok,) = msg.sender.call{value: collateral}("");
            require(ok, "BTC transfer failed");
        }

        emit PositionClosed(msg.sender, collateral, debt);
    }

    // ─── View: position data ─────────────────────────────────────────────────
    /**
     * @notice Returns live position data including accrued but not yet settled interest.
     * @return btcCollateral  BTC collateral in wei
     * @return musdDebt       Total MUSD debt (incl. accrued interest) in wei
     * @return collateralRatio  Current CR as a percentage (e.g. 200 = 200%)
     * @return accruedInterest  Unsettled interest in MUSD wei
     */
    function getPosition(address user)
        external view
        returns (
            uint256 btcCollateral,
            uint256 musdDebt,
            uint256 collateralRatio,
            uint256 accruedInterest
        )
    {
        Position memory pos = _positions[user];
        accruedInterest = _calcInterest(pos);
        uint256 totalDebt = pos.musdDebt + accruedInterest;
        collateralRatio   = totalDebt > 0
            ? _collateralRatio(pos.btcCollateral, totalDebt)
            : 0;
        return (pos.btcCollateral, totalDebt, collateralRatio, accruedInterest);
    }

    /**
     * @notice Maximum MUSD a user can borrow given collateral, at exactly MIN_CR.
     */
    function maxBorrow(uint256 btcWei) external view returns (uint256 musdAmount) {
        // collateralUsd = btcWei * btcPriceUsd / 1e18
        // maxMUSD = collateralUsd * 100 / MIN_CR   (at 150% CR)
        uint256 collateralUsd = btcWei * btcPriceUsd / 1e18;
        musdAmount = collateralUsd * 100 / MIN_COLLATERAL_RATIO;
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────
    function _collateralRatio(uint256 btcWei, uint256 musdWei) internal view returns (uint256) {
        if (musdWei == 0) return type(uint256).max;
        uint256 collateralUsd = btcWei * btcPriceUsd / 1e18;
        return collateralUsd * 100 / musdWei;
    }

    function _calcInterest(Position memory pos) internal view returns (uint256) {
        if (pos.musdDebt == 0 || pos.lastUpdate == 0) return 0;
        uint256 elapsed = block.timestamp - pos.lastUpdate;
        return pos.musdDebt * BORROW_RATE_PCT * elapsed / (100 * SECONDS_PER_YEAR);
    }

    function _accrueInterest(address user) internal {
        Position storage pos = _positions[user];
        uint256 interest = _calcInterest(pos);
        if (interest > 0) {
            pos.musdDebt += interest;
            // Mint interest to this contract (protocol revenue)
            musd.mint(address(this), interest);
        }
        pos.lastUpdate = block.timestamp;
    }

    // ─── Safety ───────────────────────────────────────────────────────────────
    receive() external payable { revert("use borrow() or addCollateral()"); }
}
