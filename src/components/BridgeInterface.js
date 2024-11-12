import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import BridgeService from "../services/bridgeService";
import { TransactionMonitor } from "../services/transactionMonitor";
import { ErrorHandler } from "../services/errorHandler";
import { LoggerService } from "../services/loggerService";
import { SUPPORTED_NETWORKS } from "../utils/constants";

const BridgeInterface = ({ provider, account }) => {
  const [bridgeService, setBridgeService] = useState(null);
  const [transactionMonitor, setTransactionMonitor] = useState(null);
  const [logger] = useState(new LoggerService());

  const [amount, setAmount] = useState("");
  const [sourceChainId, setSourceChainId] = useState("");
  const [destChainId, setDestChainId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estimatedFees, setEstimatedFees] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState(null);

  // Initialize services
  useEffect(() => {
    if (provider && account) {
      const bridgeService = new BridgeService(provider);
      const transactionMonitor = new TransactionMonitor(provider);
      setBridgeService(bridgeService);
      setTransactionMonitor(transactionMonitor);
    }
  }, [provider, account]);

  // Estimate fees when parameters change
  useEffect(() => {
    const estimateFees = async () => {
      if (!bridgeService || !amount || !sourceChainId || !destChainId) return;

      try {
        const fees = await bridgeService.estimateBridgeFees(
          sourceChainId,
          destChainId,
          amount,
          account
        );
        setEstimatedFees(fees);
      } catch (error) {
        logger.error("Fee estimation failed", { error });
      }
    };

    estimateFees();
  }, [bridgeService, amount, sourceChainId, destChainId, account]);

  // Handle bridge transaction
  const handleBridge = async () => {
    if (!bridgeService) return;

    setLoading(true);
    setError(null);
    setBridgeStatus("Initiating bridge transfer...");

    try {
      // Validate parameters
      bridgeService.validateBridgeParams({
        sourceChainId,
        destChainId,
        amount,
        receiverAddress: account,
      });

      // Get latest price proof
      const priceProof = await bridgeService.supraPullService.fetchPriceProofV2(
        [0]
      );

      // Execute bridge transfer
      const tx = await bridgeService.executeBridgeTransfer({
        sourceChainId,
        destChainId,
        amount,
        receiverAddress: account,
        priceProof,
      });

      // Monitor transaction
      const transactionId = await transactionMonitor.monitorTransaction({
        txHash: tx.hash,
        sourceChainId,
        destChainId,
        amount,
        sender: account,
        receiver: account,
      });

      // Subscribe to transaction updates
      const unsubscribe = transactionMonitor.subscribe(
        transactionId,
        (transaction) => {
          setBridgeStatus(getStatusMessage(transaction.status));
          if (
            transaction.status === "COMPLETED" ||
            transaction.status === "FAILED"
          ) {
            unsubscribe();
            setLoading(false);
          }
        }
      );

      logger.info("Bridge transfer initiated", {
        transactionId,
        txHash: tx.hash,
      });
    } catch (error) {
      const bridgeError = ErrorHandler.handleError(error);
      setError(ErrorHandler.getUserFriendlyMessage(bridgeError));
      setLoading(false);
      logger.error("Bridge transfer failed", { error: bridgeError });
    }
  };

  // Get user-friendly status message
  const getStatusMessage = (status) => {
    switch (status) {
      case "PENDING":
        return "Transaction pending...";
      case "CONFIRMING":
        return "Waiting for confirmations...";
      case "CONFIRMED":
        return "Transaction confirmed, processing cross-chain transfer...";
      case "COMPLETED":
        return "Bridge transfer completed successfully!";
      case "FAILED":
        return "Bridge transfer failed. Please try again.";
      default:
        return "";
    }
  };

  // Reset form
  const resetForm = () => {
    setAmount("");
    setError(null);
    setBridgeStatus(null);
    setEstimatedFees(null);
  };

  return {
    // Return important values and functions for the UI
    amount,
    setAmount,
    sourceChainId,
    setSourceChainId,
    destChainId,
    setDestChainId,
    loading,
    error,
    estimatedFees,
    bridgeStatus,
    handleBridge,
    resetForm,
  };
};

export default BridgeInterface;
