import React, { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { TRANSACTION_STATUS, SUPPORTED_NETWORKS } from "../utils/constants";

const BridgeContext = createContext();

export const useBridge = () => {
  const context = useContext(BridgeContext);
  if (!context) {
    throw new Error("useBridge must be used within a BridgeProvider");
  }
  return context;
};

export const BridgeProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addTransaction = useCallback((transaction) => {
    setTransactions((prev) => [
      ...prev,
      {
        ...transaction,
        timestamp: Date.now(),
        status: TRANSACTION_STATUS.PENDING,
      },
    ]);
  }, []);

  const updateTransactionStatus = useCallback((txHash, status) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.txHash === txHash ? { ...tx, status } : tx))
    );
  }, []);

  const monitorTransactions = useCallback(
    async (txHash, sourceChainId, destChainId) => {
      try {
        const sourceNetwork = SUPPORTED_NETWORKS.find(
          (n) => n.chainId === sourceChainId
        );
        const provider = new ethers.providers.JsonRpcProvider(
          sourceNetwork.rpcUrl
        );

        const receipt = await provider.waitForTransaction(txHash);

        if (receipt.status === 1) {
          updateTransactionStatus(txHash, {
            status: TRANSACTION_STATUS.SUCCESS,
            confirmations: receipt.confirmations,
          });
        } else {
          updateTransactionStatus(txHash, {
            status: TRANSACTION_STATUS.FAILED,
          });
        }
      } catch (error) {
        console.error("Error monitoring transaction:", error);
        updateTransactionStatus(txHash, {
          status: TRANSACTION_STATUS.FAILED,
          error: error.message,
        });
      }
    },
    [updateTransactionStatus]
  );

  const value = {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    clearTransactions,
    monitorTransaction,
    setLoading,
    setError,
  };

  return (
    <BridgeContext.Provider value={value}>{children}</BridgeContext.Provider>
  );
};

export default BridgeContext;
