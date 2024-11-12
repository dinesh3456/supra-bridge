import { ethers } from "ethers";

export const SUPPORTED_NETWORKS = [
  {
    name: "Sepolia",
    chainId: "11155111",
    rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL,
    blockExplorer: "https://sepolia.etherscan.io",
    bridgeAddress: process.env.REACT_APP_BRIDGE_CONTRACT_SEPOLIA,
    priceOracleAddress: process.env.REACT_APP_SUPRA_PRICE_FEED_SEPOLIA,
    lzEndpoint: process.env.REACT_APP_LZ_SEPOLIA_ENDPOINT,
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    name: "Amoy",
    chainId: "80002",
    rpcUrl: process.env.REACT_APP_MUMBAI_RPC_URL,
    blockExplorer: "https://amoy.polygonscan.com/",
    bridgeAddress: process.env.REACT_APP_BRIDGE_CONTRACT_MUMBAI,
    priceOracleAddress: process.env.REACT_APP_SUPRA_PRICE_FEED_MUMBAI,
    lzEndpoint: process.env.REACT_APP_LZ_MUMBAI_ENDPOINT,
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
];

export const LZ_CHAIN_IDS = {
  SEPOLIA: 10161,
  MUMBAI: 10109,
};

export const TOKEN_DECIMALS = 18;
export const DEFAULT_GAS_LIMIT = 200000;
