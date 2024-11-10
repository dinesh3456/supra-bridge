const config = {
  networks: {
    sepolia: {
      chainId: 11155111,
      name: "Sepolia",
      rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL,
      supraOracle: process.env.REACT_APP_SUPRA_ORACLE_SEPOLIA,
      lzEndpoint: process.env.REACT_APP_LZ_ENDPOINT_SEPOLIA,
      priceConsumer: process.env.REACT_APP_PRICE_CONSUMER_SEPOLIA,
      bridgeContract: process.env.REACT_APP_BRIDGE_CONTRACT_SEPOLIA,
      explorer: "https://sepolia.etherscan.io",
      currency: {
        name: "Sepolia ETH",
        symbol: "ETH",
        decimals: 18,
      },
    },
    mumbai: {
      chainId: 80001,
      name: "Mumbai",
      rpcUrl: process.env.REACT_APP_MUMBAI_RPC_URL,
      supraOracle: process.env.REACT_APP_SUPRA_ORACLE_MUMBAI,
      lzEndpoint: process.env.REACT_APP_LZ_ENDPOINT_MUMBAI,
      priceConsumer: process.env.REACT_APP_PRICE_CONSUMER_MUMBAI,
      bridgeContract: process.env.REACT_APP_BRIDGE_CONTRACT_MUMBAI,
      explorer: "https://mumbai.polygonscan.com",
      currency: {
        name: "Mumbai MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
    },
  },
  supra: {
    testnetRpc: process.env.REACT_APP_SUPRA_TESTNET_RPC,
    testnetGrpc: process.env.REACT_APP_SUPRA_TESTNET_GRPC,
    pairIndexes: {
      ETH_USD: 0, // Example pair index for ETH/USD
      MATIC_USD: 21, // Example pair index for MATIC/USD
    },
    refreshInterval: 30000, // 30 seconds
  },
  layerZero: {
    defaultGasLimit: 200000,
    defaultProtocolFee: "0.01",
  },
};

export default config;
