import { ethers } from "ethers";
import { LZ_CHAIN_IDS, DEFAULT_GAS_LIMIT } from "../utils/constants";
export class LayerZeroHelpers {
  /**
   * Get LayerZero chain ID from network chain ID
   * @param {string} chainId - Network chain ID
   * @returns {number} LayerZero chain ID
   */
  static getLzChainId(chainId) {
    return LZ_CHAIN_IDS[chainId];
  }

  /**
   * Create adapter parameters for LayerZero
   * @param {number} version - Adapter version
   * @param {number} gasLimit - Gas limit
   * @returns {string} Encoded adapter parameters
   */
  static createAdapterParams(version = 1, gasLimit = DEFAULT_GAS_LIMIT) {
    return ethers.utils.solidityPack(
      ["uint16", "uint256"],
      [version, gasLimit]
    );
  }

  /**
   * Encode destination address for LayerZero
   * @param {string} address - Destination address
   * @returns {string} Encoded address
   */
  static encodeDestinationAddress(address) {
    return ethers.utils.solidityPack(["address"], [address]);
  }

  /**
   * Decode LayerZero payload
   * @param {string} payload - LayerZero payload
   * @returns {Object} Decoded payload
   */
  static decodePayload(payload) {
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      ["address", "uint256", "uint256"],
      payload
    );

    return {
      toAddress: decodedData[0],
      amount: decodedData[1],
      price: decodedData[2],
    };
  }

  /**
   * Validate LayerZero configuration
   * @param {Object} config - LayerZero configuration
   * @returns {boolean} True if configuration is valid
   */
  static validateConfig(config) {
    const requiredFields = [
      "srcChainId",
      "dstChainId",
      "srcAddress",
      "dstAddress",
    ];

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate chain IDs
    if (!LZ_CHAIN_IDS[config.srcChainId] || !LZ_CHAIN_IDS[config.dstChainId]) {
      throw new Error("Invalid chain IDs");
    }

    // Validate addresses
    if (
      !ethers.utils.isAddress(config.srcAddress) ||
      !ethers.utils.isAddress(config.dstAddress)
    ) {
      throw new Error("Invalid addresses");
    }

    return true;
  }

  /**
   * Calculate message path
   * @param {string} srcAddress - Source contract address
   * @param {string} dstAddress - Destination contract address
   * @returns {string} Encoded message path
   */
  static getMessagePath(srcAddress, dstAddress) {
    return ethers.utils.solidityPack(
      ["address", "address"],
      [srcAddress, dstAddress]
    );
  }

  /**
   * Estimate LayerZero fees
   * @param {ethers.Contract} contract - Bridge contract instance
   * @param {Object} params - Fee estimation parameters
   * @returns {Promise<Object>} Estimated fees
   */
  static async estimateFees(
    contract,
    { dstChainId, toAddress, amount, adapterParams }
  ) {
    try {
      const [nativeFee, zroFee] = await contract.estimateFees(
        dstChainId,
        toAddress,
        amount,
        false,
        adapterParams
      );

      return {
        nativeFee,
        zroFee,
        total: nativeFee.add(zroFee),
      };
    } catch (error) {
      console.error("Error estimating LayerZero fees:", error);
      throw error;
    }
  }

  /**
   * Monitor LayerZero transaction
   * @param {ethers.providers.Provider} provider - Ethereum provider
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction status
   */
  static async monitorTransaction(provider, contract, txHash) {
    try {
      const receipt = await provider.waitForTransaction(txHash, 1);

      // Parse LayerZero specific events
      const events = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      return {
        status: receipt.status,
        events,
        confirmations: receipt.confirmations,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("Error monitoring LayerZero transaction:", error);
      throw error;
    }
  }

  /**
   * Get trusted remote address
   * @param {ethers.Contract} contract - Bridge contract instance
   * @param {number} remoteChainId - Remote chain ID
   * @returns {Promise<string>} Trusted remote address
   */
  static async getTrustedRemote(contract, remoteChainId) {
    try {
      return await contract.trustedRemoteLookup(remoteChainId);
    } catch (error) {
      console.error("Error getting trusted remote:", error);
      throw error;
    }
  }
}

export default LayerZeroHelpers;
