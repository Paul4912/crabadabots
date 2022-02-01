//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

interface CrabadaMining {
    function startGame(uint256 teamId) external;

    function closeGame(uint256 gameId) external;
}
