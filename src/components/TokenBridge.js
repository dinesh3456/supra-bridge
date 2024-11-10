import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ethers } from "ethers";
import NetworkSelector from "./NetworkSelector";
import PriceFeed from "./PriceFeed";
import {
  SUPPORTED_NETWORKS,
  LZ_CHAIN_IDS,
  DEFAULT_GAS_LIMIT,
} from "../utils/constants";
import TokenBridgeABI from "../abis/TokenBridge.json";

const TokenBridge = ({ provider, account }) => {
  const [amount, setAmount] = useState("");
  const [sourceNetwork, setSourceNetwork] = useState(
    SUPPORTED_NETWORKS[0].chainId
  );
  const [destNetwork, setDestNetwork] = useState(SUPPORTED_NETWORKS[1].chainId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const resetState = () => {
    setAmount("");
    setError("");
    setStatus("");
  };

  const validateInput = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (!account) {
      setError("Please connect your wallet");
      return false;
    }
    return true;
  };

  const getTokenContract = async (chainId) => {
    const network = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
    if (!network) throw new Error("Network not supported");

    const contract = new ethers.Contract(
      network.bridgeAddress,
      TokenBridgeABI,
      provider.getSigner()
    );
    return contract;
  };

  const estimateFees = async () => {
    try {
      const sourceContract = await getTokenContract(sourceNetwork);
      const destinationChainId = LZ_CHAIN_IDS[destNetwork];

      const adapterParams = ethers.utils.solidityPack(
        ["uint16", "uint256"],
        [1, DEFAULT_GAS_LIMIT]
      );

      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [account, ethers.utils.parseEther(amount)]
      );

      const [nativeFee] = await sourceContract.estimateFees(
        destinationChainId,
        ethers.utils.solidityPack(["address"], [account]),
        payload,
        false,
        adapterParams
      );

      return nativeFee;
    } catch (error) {
      console.error("Error estimating fees:", error);
      throw error;
    }
  };

  const handleBridge = async () => {
    if (!validateInput()) return;

    setLoading(true);
    setError("");
    setStatus("Initiating bridge transfer...");

    try {
      const sourceContract = await getTokenContract(sourceNetwork);
      const destinationChainId = LZ_CHAIN_IDS[destNetwork];

      // Estimate fees
      const fees = await estimateFees();

      // Prepare transaction parameters
      const adapterParams = ethers.utils.solidityPack(
        ["uint16", "uint256"],
        [1, DEFAULT_GAS_LIMIT]
      );

      // Send bridge transaction
      const tx = await sourceContract.sendTokens(
        destinationChainId,
        ethers.utils.solidityPack(["address"], [account]),
        ethers.utils.parseEther(amount),
        account,
        ethers.constants.AddressZero,
        adapterParams,
        { value: fees }
      );

      setStatus("Transaction submitted. Waiting for confirmation...");

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      setStatus("Bridge transfer completed successfully!");
      resetState();
    } catch (error) {
      console.error("Bridge transfer failed:", error);
      setError(error.message || "Bridge transfer failed");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 3, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Cross-Chain Bridge
      </Typography>

      <NetworkSelector
        selectedSourceNetwork={sourceNetwork}
        selectedDestNetwork={destNetwork}
        onSourceNetworkChange={setSourceNetwork}
        onDestNetworkChange={setDestNetwork}
      />

      <Box sx={{ mb: 3 }}>
        <PriceFeed tokenSymbol="ETH" />
      </Box>

      <TextField
        fullWidth
        label="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        sx={{ mb: 2 }}
        disabled={loading}
      />

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {status && (
        <Typography color="primary" sx={{ mb: 2 }}>
          {status}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleBridge}
        disabled={loading || !account}
        sx={{ position: "relative" }}
      >
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              position: "absolute",
              left: "50%",
              marginLeft: "-12px",
            }}
          />
        )}
        {loading ? "Processing..." : "Bridge Tokens"}
      </Button>
    </Card>
  );
};

export default TokenBridge;
