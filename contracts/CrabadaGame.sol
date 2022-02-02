//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

interface CrabadaGame {
    function startGame(uint256 teamId) external;

    function closeGame(uint256 gameId) external;

    function reinforceDefense(uint256 gameId, uint256 crabadaId, uint256 borrowPrice) external;
}
