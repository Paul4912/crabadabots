//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

interface CRAContract {
  function balanceOf(address account) external view returns (uint256);
}