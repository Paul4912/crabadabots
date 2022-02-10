//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

interface TUSContract {
  function balanceOf(address account) external view returns (uint256);
}