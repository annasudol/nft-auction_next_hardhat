require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
// import "./task"
const ALCHEMY_PROJECT_ID = process.env.ALCHEMY_PROJECT_ID || '';
const MNEMONIC = process.env.MNEMONIC || '';;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_PROJECT_ID}`,
      allowUnlimitedContractSize: true,
      accounts: { mnemonic: MNEMONIC }
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ``
  },
};

export default config;
