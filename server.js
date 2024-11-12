const express = require("express");
const cors = require("cors");
const PullServiceClient = require("./pullServiceClient");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Supra client
const supraPullClient = new PullServiceClient("testnet-dora-2.supra.com:443");

// Main endpoint for getting price proof
app.post("/api/proxy", async (req, res) => {
  try {
    // Prepare request for Supra
    const request = {
      pair_indexes: [0], // ETH/USD pair
      chain_type: "evm",
    };

    console.log("Requesting proof for:", request);

    // Get proof from Supra
    const response = await supraPullClient.getProof(request);
    console.log("Received proof response:", response);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error getting proof:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/proxy/health", (req, res) => {
  res.json({ status: "healthy" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
