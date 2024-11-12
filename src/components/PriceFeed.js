import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Box,
} from "@mui/material";
import SupraPullService from "../services/supraPullService";

// ABI for price consumer contract
const PRICE_CONSUMER_ABI = [
  "function getPriceDataWithRound(bytes calldata _bytesProof, uint256 pair) external returns (uint256 price, uint256 timestamp, uint256 round)",
];

const PriceFeed = ({ provider, pairIndex, priceConsumerAddress }) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrice = async () => {
    try {
      const supraPullService = new SupraPullService();
      const signer = provider.getSigner();

      // Get contract instance
      const priceConsumer = new ethers.Contract(
        priceConsumerAddress,
        PRICE_CONSUMER_ABI,
        signer
      );

      // Get price proof from Supra
      const proof = await supraPullService.fetchPriceProofV2([pairIndex]);

      // Get verified price data from contract
      const [priceData, timestamp, round] =
        await priceConsumer.getPriceDataWithRound(proof, pairIndex);

      // Convert price to human readable format (8 decimals)
      const priceValue = ethers.utils.formatUnits(priceData, 8);
      setPrice(priceValue);
      setLastUpdate(new Date(timestamp.toNumber() * 1000));
      setError(null);
    } catch (error) {
      console.error("Error fetching price:", error);
      setError("Failed to fetch verified price");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (provider && priceConsumerAddress) {
      fetchPrice();
      // Update price every 30 seconds
      const interval = setInterval(fetchPrice, 30000);
      return () => clearInterval(interval);
    }
  }, [provider, priceConsumerAddress]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Loading price feed...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Verified Price Feed
        </Typography>
        <Typography variant="h4" color="primary">
          ${Number(price).toFixed(2)}
        </Typography>
        {lastUpdate && (
          <Typography variant="caption" color="textSecondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceFeed;
