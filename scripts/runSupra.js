const { ethers } = require("hardhat");
const PullServiceClient = require("../src/services/pullServiceClient");
require("dotenv").config();

// Configuration
const address = "testnet-dora.supraoracles.com:443";
const pairIndexes = [0]; // ETH/USD pair
const sepoliaPullContractAddress = "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917";

async function main() {
  console.log("Initializing Supra Oracle integration...");
  console.log("Target chain:", sepoliaPullContractAddress);

  // Create client
  const client = new PullServiceClient(address);

  // Create request
  const request = {
    pair_indexes: pairIndexes,
    chain_type: "evm",
  };

  console.log("Getting price proof...");

  try {
    // Get proof
    await new Promise((resolve, reject) => {
      client.getProof(request, async (err, response) => {
        if (err) {
          console.error("Error getting proof:", err.details);
          reject(err);
          return;
        }

        try {
          console.log("Proof received, processing...");
          await processProof(response.evm);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error in main:", error);
    process.exit(1);
  }
}

async function processProof(evmProof) {
  try {
    console.log("Deploying Supra contract...");

    // Get contract factory
    const Supra = await ethers.getContractFactory("Supra");

    // Deploy contract
    const supra = await Supra.deploy(sepoliaPullContractAddress);
    await supra.deployed();

    const contractAddress = await supra.getAddress();
    console.log("Contract deployed to:", contractAddress);

    // Prepare proof data
    const hex = ethers.utils.hexlify(evmProof.proof_bytes);
    console.log("Proof prepared");

    // Send transaction
    console.log("Sending transaction...");
    const tx = await supra.deliverPriceData(hex);
    console.log("Transaction sent:", tx.hash);

    // Wait for confirmation
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait(1);
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Get price data
    const priceData = await supra.getLatestPrice(0);
    console.log("Price data:", {
      price: ethers.utils.formatUnits(priceData[0], priceData[1]),
      decimals: priceData[1].toString(),
    });
  } catch (error) {
    console.error("Error processing proof:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("Process completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Process failed:", error);
    process.exit(1);
  });
