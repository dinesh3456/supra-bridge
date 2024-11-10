const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);

  // Get contract instances
  const PriceConsumer = await ethers.getContractFactory("PriceConsumer");
  const Bridge = await ethers.getContractFactory("BridgeContract");

  // Test price feed first
  console.log("\nTesting price feed...");
  const priceConsumer = PriceConsumer.attach(
    process.env.REACT_APP_PRICE_CONSUMER_SEPOLIA
  );

  // Get proof data from Supra API
  const response = await fetch(process.env.REACT_APP_SUPRA_TESTNET_RPC, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "supra_getProofV2",
      params: [0], // ETH/USD pair
      id: 1,
    }),
  });

  const proofData = await response.json();

  try {
    const priceData = await priceConsumer.getPriceDataWithRound(
      proofData.result,
      0 // ETH/USD pair
    );
    console.log("Price data received:", {
      price: priceData.price.toString(),
      timestamp: priceData.timestamp.toString(),
      round: priceData.round.toString(),
    });
  } catch (error) {
    console.error("Error testing price feed:", error);
  }

  console.log("\nTest complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
