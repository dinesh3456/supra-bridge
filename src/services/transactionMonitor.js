import { ethers } from "ethers";
import { SUPPORTED_NETWORKS, LZ_CHAIN_IDS } from "../utils/constants";
import { ErrorHandler, BridgeError, ErrorCodes } from "./errorHandler";
import { LayerZeroHelpers } from "./layerZeroHelpers";

export const TransactionStatus = {
  PENDING: "PENDING",
  CONFIRMING: "CONFIRMING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

export class TransactionMonitor {
  constructor(provider) {
    this.provider = provider;
    this.transactions = new Map();
    this.callbacks = new Map();
  }

  /**
   * Start monitoring a new transaction
   * @param {Object} params - Transaction parameters
   * @returns {string} Transaction ID
   */
  async monitorTransaction({
    txHash,
    sourceChainId,
    destChainId,
    amount,
    sender,
    receiver,
    type = "bridge",
  }) {
    try {
      const transactionId = this.generateTransactionId(txHash, sourceChainId);

      const transaction = {
        id: transactionId,
        txHash,
        sourceChainId,
        destChainId,
        amount,
        sender,
        receiver,
        type,
        status: TransactionStatus.PENDING,
        timestamp: Date.now(),
        confirmations: 0,
        sourceReceipt: null,
        destReceipt: null,
      };

      this.transactions.set(transactionId, transaction);
      this.startMonitoring(transactionId);

      return transactionId;
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: "TransactionMonitor.monitorTransaction",
        txHash,
        sourceChainId,
        destChainId,
      });
    }
  }

  /**
   * Start monitoring process for a transaction
   * @param {string} transactionId - Transaction ID
   */
  async startMonitoring(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    try {
      // Monitor source chain transaction
      const sourceReceipt = await this.provider.waitForTransaction(
        transaction.txHash,
        1 // Wait for 1 confirmation
      );

      // Update transaction status
      transaction.sourceReceipt = sourceReceipt;
      transaction.status = TransactionStatus.CONFIRMING;
      transaction.confirmations = sourceReceipt.confirmations;
      this.updateTransaction(transaction);

      // Monitor for LayerZero events
      if (sourceReceipt.status === 1) {
        await this.monitorLayerZeroMessage(transaction);
      } else {
        throw new BridgeError(
          "Source transaction failed",
          ErrorCodes.TRANSACTION_FAILED
        );
      }
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.error = ErrorHandler.parseError(error);
      this.updateTransaction(transaction);
    }
  }

  /**
   * Monitor LayerZero message delivery
   * @param {Object} transaction - Transaction object
   */
  async monitorLayerZeroMessage(transaction) {
    try {
      // Get destination chain provider
      const destNetwork = SUPPORTED_NETWORKS.find(
        (n) => n.chainId === transaction.destChainId
      );
      const destProvider = new ethers.providers.JsonRpcProvider(
        destNetwork.rpcUrl
      );

      // Monitor for message received event
      const filter = {
        address: destNetwork.bridgeAddress,
        topics: [ethers.utils.id("MessageReceived(bytes32,address,uint256)")],
      };

      destProvider.once(filter, async (log) => {
        const receipt = await destProvider.getTransactionReceipt(
          log.transactionHash
        );

        transaction.destReceipt = receipt;
        transaction.status = TransactionStatus.COMPLETED;
        this.updateTransaction(transaction);
      });

      // Set timeout for message delivery
      setTimeout(() => {
        if (transaction.status !== TransactionStatus.COMPLETED) {
          transaction.status = TransactionStatus.FAILED;
          transaction.error = new BridgeError(
            "Cross-chain message delivery timeout",
            ErrorCodes.TRANSACTION_TIMEOUT
          );
          this.updateTransaction(transaction);
        }
      }, 600000); // 10 minutes timeout
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: "TransactionMonitor.monitorLayerZeroMessage",
        transaction,
      });
    }
  }

  /**
   * Update transaction and trigger callbacks
   * @param {Object} transaction - Transaction object
   */
  updateTransaction(transaction) {
    this.transactions.set(transaction.id, transaction);

    // Trigger callbacks
    const callbacks = this.callbacks.get(transaction.id) || [];
    callbacks.forEach((callback) => callback(transaction));
  }

  /**
   * Subscribe to transaction updates
   * @param {string} transactionId - Transaction ID
   * @param {Function} callback - Callback function
   */
  subscribe(transactionId, callback) {
    const callbacks = this.callbacks.get(transactionId) || [];
    callbacks.push(callback);
    this.callbacks.set(transactionId, callbacks);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(transactionId) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        this.callbacks.set(transactionId, callbacks);
      }
    };
  }

  /**
   * Get transaction status
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Transaction status
   */
  getTransaction(transactionId) {
    return this.transactions.get(transactionId);
  }

  /**
   * Generate unique transaction ID
   * @param {string} txHash - Transaction hash
   * @param {string} chainId - Chain ID
   * @returns {string} Transaction ID
   */
  generateTransactionId(txHash, chainId) {
    return `${chainId}-${txHash}`;
  }

  /**
   * Get all transactions for an address
   * @param {string} address - User address
   * @returns {Array} Array of transactions
   */
  getTransactionsByAddress(address) {
    const userTransactions = [];
    for (const transaction of this.transactions.values()) {
      if (
        transaction.sender.toLowerCase() === address.toLowerCase() ||
        transaction.receiver.toLowerCase() === address.toLowerCase()
      ) {
        userTransactions.push(transaction);
      }
    }
    return userTransactions;
  }

  /**
   * Clear old transactions
   * @param {number} age - Age in milliseconds
   */
  clearOldTransactions(age = 24 * 60 * 60 * 1000) {
    // 24 hours
    const now = Date.now();
    for (const [id, transaction] of this.transactions.entries()) {
      if (now - transaction.timestamp > age) {
        this.transactions.delete(id);
        this.callbacks.delete(id);
      }
    }
  }
}

export default TransactionMonitor;
