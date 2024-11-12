import PullServiceClient from "./pullServiceClient";
import { ethers } from "ethers";

class SupraPullService {
  constructor() {
    this.client = new PullServiceClient("testnet-dora-2.supra.com:443");
  }

  async fetchPriceProofV2(pairIndexes = [0]) {
    try {
      console.log("Requesting price proof for pairs:", pairIndexes);

      // Create request object
      const request = {
        pair_indexes: pairIndexes,
        chain_type: "evm",
      };

      // Get proof from gRPC service
      const response = await this.client.getProof(request);

      if (!response || !response.evm || !response.evm.proof_bytes) {
        throw new Error("Invalid proof response from Supra Oracle");
      }

      // Convert proof bytes to hex string for contract consumption
      const proofHex = this.bytesToHex(response.evm.proof_bytes);
      console.log("Received valid price proof");

      return proofHex;
    } catch (error) {
      console.error("Error in fetchPriceProofV2:", error);
      throw error;
    }
  }

  bytesToHex(bytes) {
    if (Buffer.isBuffer(bytes)) {
      return "0x" + bytes.toString("hex");
    } else if (Array.isArray(bytes)) {
      return "0x" + Buffer.from(bytes).toString("hex");
    } else {
      throw new Error("Invalid bytes input");
    }
  }

  async deliverPriceToContract(contract, proof) {
    try {
      const tx = await contract.deliverPriceData(proof);
      console.log("Price delivery transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Price delivery confirmed in block:", receipt.blockNumber);
      return receipt;
    } catch (error) {
      console.error("Error delivering price to contract:", error);
      throw error;
    }
  }

  async getVerifiedPrice(contract, pairId = 0) {
    try {
      const proof = await this.fetchPriceProofV2([pairId]);
      await this.deliverPriceToContract(contract, proof);
      const [price, decimals] = await contract.getLatestPrice(pairId);
      return {
        price: ethers.utils.formatUnits(price, decimals),
        decimals: decimals.toString(),
        raw: price.toString(),
      };
    } catch (error) {
      console.error("Error getting verified price:", error);
      throw error;
    }
  }
}

export default SupraPullService;
