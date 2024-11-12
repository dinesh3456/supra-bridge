const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

// Updated ABI to match the Supra example contract exactly
const SUPRA_ABI = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_bytesProof",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "pair",
        type: "uint256",
      },
    ],
    name: "GetPairPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const PullServiceClient = require("../src/services/pullServiceClient");

class SupraPullService {
  constructor() {
    const grpcEndpoint =
      process.env.REACT_APP_SUPRA_TESTNET_GRPC ||
      "testnet-dora-2.supra.com:443";
    console.log("Initializing Supra service with endpoint:", grpcEndpoint);
    this.client = new PullServiceClient(grpcEndpoint);
  }

  async fetchPriceProofV2(pairIndexes = [0], retryCount = 3) {
    let lastError;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}/${retryCount} - Requesting price proof for pairs:`,
          pairIndexes
        );

        const request = {
          pair_indexes: pairIndexes,
          chain_type: "evm",
        };

        const proof = await new Promise((resolve, reject) => {
          this.client.getProof(request, (error, response) => {
            if (error) {
              console.error(`Attempt ${attempt} failed:`, error);
              reject(error);
              return;
            }

            if (!response || !response.evm || !response.evm.proof_bytes) {
              reject(new Error("Invalid proof response from Supra Oracle"));
              return;
            }

            const proofHex =
              "0x" + Buffer.from(response.evm.proof_bytes).toString("hex");
            console.log(
              `Attempt ${attempt} successful - Received valid price proof`
            );
            resolve(proofHex);
          });
        });

        return proof;
      } catch (error) {
        lastError = error;
        if (attempt < retryCount) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getVerifiedPrice(contract, pairId = 0) {
    try {
      console.log("Getting proof for pair ID:", pairId);
      const proof = await this.fetchPriceProofV2([pairId]);
      console.log("Received proof:", { length: proof.length });

      // Try to get price using GetPairPrice
      console.log("Getting pair price...");
      const overrides = {
        gasLimit: 500000,
      };

      // Send transaction and wait for confirmation
      const tx = await contract.GetPairPrice(proof, pairId, overrides);
      console.log("Transaction sent:", tx.hash);

      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);

      // Get the events or return value
      if (receipt.events && receipt.events.length > 0) {
        // If there are events, try to parse them
        console.log("Transaction events:", receipt.events);
      }

      // Try to get the return value from transaction data
      try {
        const iface = new ethers.utils.Interface(SUPRA_ABI);
        const result = iface.decodeFunctionResult(
          "GetPairPrice",
          receipt.logs[0].data
        );
        const price = result[0];

        return {
          price: price.toString(),
          decimals: 8, // Supra uses 8 decimals by default
          formattedPrice: ethers.utils.formatUnits(price, 8),
        };
      } catch (parseError) {
        console.error("Error parsing transaction result:", parseError);
        throw parseError;
      }
    } catch (error) {
      console.error("Error getting verified price:", error);
      // Log more details about the error
      if (error.error && error.error.body) {
        try {
          const errorBody = JSON.parse(error.error.body);
          console.error("Detailed error:", errorBody);
        } catch (e) {
          console.error("Raw error body:", error.error.body);
        }
      }
      throw error;
    }
  }
}

async function main() {
  try {
    console.log("Initializing Supra Oracle test...");

    const provider = new ethers.providers.StaticJsonRpcProvider(
      process.env.REACT_APP_SEPOLIA_RPC_URL,
      {
        chainId: 11155111,
        name: "sepolia",
      }
    );

    console.log("Testing provider connection...");
    const blockNumber = await provider.getBlockNumber();
    console.log("Current block number:", blockNumber);

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("Using address:", wallet.address);

    const balance = await wallet.getBalance();
    console.log("Wallet balance:", ethers.utils.formatEther(balance), "ETH");

    if (balance.isZero()) {
      throw new Error("Wallet has no balance");
    }

    const supraPriceOracleAddress =
      process.env.REACT_APP_SUPRA_PRICE_FEED_SEPOLIA;
    console.log("Using Supra Oracle address:", supraPriceOracleAddress);

    if (!supraPriceOracleAddress) {
      throw new Error("Supra Oracle address not configured");
    }

    const supraPullContract = new ethers.Contract(
      supraPriceOracleAddress,
      SUPRA_ABI,
      wallet
    );

    const supraPullService = new SupraPullService();

    console.log("Getting ETH/USD price...");
    const priceData = await supraPullService.getVerifiedPrice(
      supraPullContract
    );

    console.log("\nPrice data received:");
    console.log("- Raw Value:", priceData.price);
    console.log("- Decimals:", priceData.decimals);
    console.log(`- Formatted Price: $${priceData.formattedPrice}`);
  } catch (error) {
    console.error("\nError in test script:", error);
    if (error.reason) console.error("Reason:", error.reason);
    throw error;
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

main()
  .then(() => {
    console.log("Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
