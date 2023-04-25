import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "./tasks"

import * as dotenv from 'dotenv'
dotenv.config()

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ""

const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;
const MNEMONIC = process.env.MNEMONIC;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
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
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
        chainId: 31337,
    },
    // use npx hardhat node
    local: {
      url: "http://127.0.0.1:8545",
    },
    ganache: {
      url: "http://127.0.0.1:9545",
    },
    mumbai: {
      url: MUMBAI_RPC_URL,
      accounts: {mnemonic: MNEMONIC},
    },
    goerli: {
        chainId: 5,
        url: GOERLI_RPC_URL,
        accounts: {mnemonic: MNEMONIC},
    }
  },
  namedAccounts: {
    deployer: {
        default: 0,
    },
    recipient: {
        default: 1
    }
  },
};

export default config;