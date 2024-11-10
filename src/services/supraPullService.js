import axios from "axios";

const SUPRA_TESTNET_RPC = "https://rpc-testnet-dora-2.supra.com";

class SupraPullService {
  constructor() {
    this.baseUrl = SUPRA_TESTNET_RPC;
  }

  async fetchPriceProof(pairIndexes) {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: "2.0",
        method: "supra_getProof",
        params: [pairIndexes],
        id: 1,
      });

      if (response.data.error) {
        throw new Error(`Supra API Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      console.error("Error fetching price proof:", error);
      throw error;
    }
  }

  async fetchPriceProofV2(pairIndexes) {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: "2.0",
        method: "supra_getProofV2",
        params: [pairIndexes],
        id: 1,
      });

      if (response.data.error) {
        throw new Error(`Supra API Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      console.error("Error fetching price proof V2:", error);
      throw error;
    }
  }
}
