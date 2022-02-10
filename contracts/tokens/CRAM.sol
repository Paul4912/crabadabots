//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

interface CRAMContract {
  function balanceOf(address account) external view returns (uint256);
}