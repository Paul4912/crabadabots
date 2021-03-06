import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";

const ALCHEMY_API_MAINNET_URL = process.env.ALCHEMY_API_MAINNET_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"; // well known private key
const isHDWallet = process.env.MNEMONIC_PHRASE !== "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { version: "0.8.0", settings: {} },
      { version: "0.6.12", settings: {} },
    ],
  },
  networks: {
    avalanche: {
      url: ALCHEMY_API_MAINNET_URL,
      //@ts-ignore
      accounts: isHDWallet
        ? {
            mnemonic: process.env.MNEMONIC_PHRASE,
          }
        : [PRIVATE_KEY],
    },
    swimmer: {
      url: "https://subnets.avax.network/swimmer/mainnet/rpc",
      //@ts-ignore
      accounts: isHDWallet
        ? {
            mnemonic: process.env.MNEMONIC_PHRASE,
          }
        : [PRIVATE_KEY],
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
    local: {
      url: "http://localhost:8545",
      gas: "auto",
    },
  },
  mocha: {
    timeout: 60000,
  },
};

export default config;
