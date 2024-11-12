import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import BridgeService from "../services/bridgeService";
import { TransactionMonitor } from "../services/transactionMonitor";
import { ErrorHandler } from "../services/errorHandler";
import { LoggerService } from "../services/loggerService";
import { SUPPORTED_NETWORKS } from "../utils/constants";

const BridgeUI = ({ provider, account }) => {
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Initialize services
  useEffect(() => {
    if (provider && account) {
      const bridgeService = new BridgeService(provider);
      const monitor = new TransactionMonitor(provider);
      setBridgeService(bridgeService);
      setTransactionMonitor(monitor);
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

  const handleBridge = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

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
            setShowConfirmation(false);
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
      setShowConfirmation(false);
      logger.error("Bridge transfer failed", { error: bridgeError });
    }
  };

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

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Cross-Chain Bridge
        </Typography>

        <form onSubmit={handleBridge}>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Source Network</InputLabel>
              <Select
                value={sourceChainId}
                onChange={(e) => setSourceChainId(e.target.value)}
                label="Source Network"
                disabled={loading}
              >
                <MenuItem value="">Select Network</MenuItem>
                {SUPPORTED_NETWORKS.map((network) => (
                  <MenuItem
                    key={network.chainId}
                    value={network.chainId}
                    disabled={network.chainId === destChainId}
                  >
                    {network.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Destination Network</InputLabel>
              <Select
                value={destChainId}
                onChange={(e) => setDestChainId(e.target.value)}
                label="Destination Network"
                disabled={loading}
              >
                <MenuItem value="">Select Network</MenuItem>
                {SUPPORTED_NETWORKS.map((network) => (
                  <MenuItem
                    key={network.chainId}
                    value={network.chainId}
                    disabled={network.chainId === sourceChainId}
                  >
                    {network.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            fullWidth
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            sx={{ mb: 2 }}
            disabled={loading}
            inputProps={{ step: "0.000001", min: "0" }}
          />

          {estimatedFees && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Estimated Fees</AlertTitle>
              <Typography variant="body2">
                Network Fee: {ethers.utils.formatEther(estimatedFees.nativeFee)}{" "}
                ETH
                {estimatedFees.zroFee.gt(0) && (
                  <Box>
                    ZRO Fee: {ethers.utils.formatEther(estimatedFees.zroFee)}{" "}
                    ZRO
                  </Box>
                )}
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          {bridgeStatus && (
            <Alert severity={loading ? "info" : "success"} sx={{ mb: 2 }}>
              <AlertTitle>{loading ? "Processing" : "Status"}</AlertTitle>
              {bridgeStatus}
            </Alert>
          )}

          {showConfirmation && !loading && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Confirm Transaction</AlertTitle>
              <Typography variant="body2">
                Amount: {amount}
                <br />
                From:{" "}
                {
                  SUPPORTED_NETWORKS.find((n) => n.chainId === sourceChainId)
                    ?.name
                }
                <br />
                To:{" "}
                {
                  SUPPORTED_NETWORKS.find((n) => n.chainId === destChainId)
                    ?.name
                }
                {estimatedFees && (
                  <>
                    <br />
                    Fee: {ethers.utils.formatEther(estimatedFees.nativeFee)} ETH
                  </>
                )}
              </Typography>
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ position: "relative" }}
          >
            {loading ? (
              <>
                <CircularProgress
                  size={24}
                  sx={{
                    position: "absolute",
                    left: "50%",
                    marginLeft: "-12px",
                  }}
                />
                Processing...
              </>
            ) : showConfirmation ? (
              "Confirm Bridge"
            ) : (
              "Bridge Tokens"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BridgeUI;
