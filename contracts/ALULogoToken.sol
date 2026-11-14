// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ALULogoToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000;

    constructor(address initialOwner)
        ERC20("ALU Logo Token", "ALUT")
        Ownable(initialOwner)
    {
        _mint(initialOwner, INITIAL_SUPPLY * 10 ** decimals());
    }

    function distributeShares(
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");

        _transfer(owner(), recipient, amount);
    }

    function ownershipPercentage(
        address account
    ) external view returns (uint256) {
        uint256 supply = totalSupply();

        if (supply == 0) {
            return 0;
        }

        return (balanceOf(account) * 100) / supply;
    }
}