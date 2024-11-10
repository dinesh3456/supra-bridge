import { ethers } from "ethers"; // Add this line to import ethers

export const SUPPORTED_NETWORKS = [
  {
    name: "Sepolia",
    chainId: "11155111",
    rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL,
    blockExplorer: "https://sepolia.etherscan.io",
    bridgeAddress: process.env.REACT_APP_SEPOLIA_BRIDGE_ADDRESS,
    priceOracleAddress: process.env.REACT_APP_SUPRA_PRICE_FEED_SEPOLIA,
    lzEndpoint: process.env.REACT_APP_LZ_SEPOLIA_ENDPOINT,
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    name: "Mumbai",
    chainId: "80001",
    rpcUrl: process.env.REACT_APP_MUMBAI_RPC_URL,
    blockExplorer: "https://mumbai.polygonscan.com",
    bridgeAddress: process.env.REACT_APP_MUMBAI_BRIDGE_ADDRESS,
    priceOracleAddress: process.env.REACT_APP_SUPRA_PRICE_FEED_MUMBAI,
    lzEndpoint: process.env.REACT_APP_LZ_MUMBAI_ENDPOINT,
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
];

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  NONE: "NONE",
};

export const LZ_CHAIN_IDS = {
  SEPOLIA: 10161, // LayerZero chainId for Sepolia
  MUMBAI: 10109, // LayerZero chainId for Mumbai
};

export const TOKEN_DECIMALS = 18;

// Default gas limits for LayerZero transactions
export const DEFAULT_GAS_LIMIT = 200000;
export const ADAPTER_PARAMS = ethers.utils.solidityPack(
  ["uint16", "uint256"],
  [1, DEFAULT_GAS_LIMIT]
);
