// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockPYUSD
 * @notice Mock PYUSD token for local testing
 * @dev This is a simple ERC20 token that mimics PYUSD (6 decimals)
 * Only for use in local development and testing
 */
contract MockPYUSD is ERC20 {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("PayPal USD (Mock)", "PYUSD") {}

    /**
     * @notice Returns the number of decimals (6, like real PYUSD)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Mint tokens to an address (for testing only)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in base units)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address (for testing only)
     * @param from Address to burn tokens from
     * @param amount Amount to burn (in base units)
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

