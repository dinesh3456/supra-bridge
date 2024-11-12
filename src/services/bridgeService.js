import { ethers } from "ethers";
import TokenBridgeABI from "../contracts/abis/TokenBridge.json";
import SupraPullService from "./supraPullService";
import {
  SUPPORTED_NETWORKS,
  LZ_CHAIN_IDS,
  DEFAULT_GAS_LIMIT,
} from "../utils/constants";

class BridgeService {
  constructor(provider) {
    this.provider = provider;
    this.supraPullService = new SupraPullService();
  }

  /**
   * Initialize bridge contract instance
   * @param {string} chainId - The chain ID
   * @returns {ethers.Contract} Bridge contract instance
   */
  getBridgeContract(chainId) {
    const network = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
    if (!network) throw new Error("Unsupported network");

    return new ethers.Contract(
      network.bridgeAddress,
      TokenBridgeABI.abi,
      this.provider.getSigner()
    );
  }

  /**
   * Estimate fees for bridge transfer
   * @param {string} sourceChainId - Source chain ID
   * @param {string} destChainId - Destination chain ID
   * @param {string} amount - Amount to bridge
   * @param {string} receiverAddress - Receiver address
   * @returns {Promise<{nativeFee: BigNumber, zroFee: BigNumber}>}
   */
  async estimateBridgeFees(
    sourceChainId,
    destChainId,
    amount,
    receiverAddress
  ) {
    try {
      const bridgeContract = this.getBridgeContract(sourceChainId);
      const destinationLzChainId = LZ_CHAIN_IDS[destChainId];

      const adapterParams = ethers.utils.solidityPack(
        ["uint16", "uint256"],
        [1, DEFAULT_GAS_LIMIT]
      );

      const [nativeFee, zroFee] = await bridgeContract.estimateFees(
        destinationLzChainId,
        ethers.utils.solidityPack(["address"], [receiverAddress]),
        ethers.utils.parseEther(amount),
        false,
        adapterParams
      );

      return { nativeFee, zroFee };
    } catch (error) {
      console.error("Error estimating bridge fees:", error);
      throw error;
    }
  }

  /**
   * Execute bridge transfer
   * @param {Object} params - Bridge parameters
   * @returns {Promise<ethers.ContractTransaction>}
   */
  async executeBridgeTransfer({
    sourceChainId,
    destChainId,
    amount,
    receiverAddress,
    priceProof,
  }) {
    try {
      const bridgeContract = this.getBridgeContract(sourceChainId);
      const destinationLzChainId = LZ_CHAIN_IDS[destChainId];

      // Get bridge fees
      const { nativeFee } = await this.estimateBridgeFees(
        sourceChainId,
        destChainId,
        amount,
        receiverAddress
      );

      // Prepare adapter parameters
      const adapterParams = ethers.utils.solidityPack(
        ["uint16", "uint256"],
        [1, DEFAULT_GAS_LIMIT]
      );

      // Prepare bridge parameters
      const bridgeParams = {
        dstChainId: destinationLzChainId,
        toAddress: ethers.utils.solidityPack(["address"], [receiverAddress]),
        amount: ethers.utils.parseEther(amount),
        refundAddress: receiverAddress,
        zroPaymentAddress: ethers.constants.AddressZero,
        adapterParams: adapterParams,
        priceProof: priceProof,
      };

      // Execute bridge transfer
      const tx = await bridgeContract.sendTokens(
        bridgeParams.dstChainId,
        bridgeParams.toAddress,
        bridgeParams.amount,
        bridgeParams.refundAddress,
        bridgeParams.zroPaymentAddress,
        bridgeParams.adapterParams,
        bridgeParams.priceProof,
        { value: nativeFee }
      );

      return tx;
    } catch (error) {
      console.error("Error executing bridge transfer:", error);
      throw error;
    }
  }

  /**
   * Get transaction status
   * @param {string} txHash - Transaction hash
   * @param {string} chainId - Chain ID
   * @returns {Promise<Object>} Transaction status
   */
  async getTransactionStatus(txHash, chainId) {
    try {
      const network = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
      if (!network) throw new Error("Unsupported network");

      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return { status: "pending" };

      return {
        status: receipt.status === 1 ? "success" : "failed",
        confirmations: receipt.confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: (await this.provider.getBlock(receipt.blockNumber))
          .timestamp,
      };
    } catch (error) {
      console.error("Error getting transaction status:", error);
      throw error;
    }
  }

  /**
   * Validate bridge parameters
   * @param {Object} params - Bridge parameters
   * @returns {boolean} True if parameters are valid
   */
  validateBridgeParams({
    sourceChainId,
    destChainId,
    amount,
    receiverAddress,
  }) {
    if (!sourceChainId || !destChainId) {
      throw new Error("Invalid chain IDs");
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error("Invalid amount");
    }

    if (!ethers.utils.isAddress(receiverAddress)) {
      throw new Error("Invalid receiver address");
    }

    if (sourceChainId === destChainId) {
      throw new Error("Source and destination chains must be different");
    }

    return true;
  }

  /**
   * Get bridge configuration for a chain
   * @param {string} chainId - Chain ID
   * @returns {Object} Bridge configuration
   */
  getBridgeConfig(chainId) {
    const network = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
    if (!network) throw new Error("Unsupported network");

    return {
      bridgeAddress: network.bridgeAddress,
      priceOracleAddress: network.priceOracleAddress,
      lzEndpoint: network.lzEndpoint,
      rpcUrl: network.rpcUrl,
      blockExplorer: network.blockExplorer,
    };
  }
}

export default BridgeService;
