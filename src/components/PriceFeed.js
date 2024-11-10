import React, { useState, useEffect } from "react";
import { Card, Typography, CircularProgress } from "@mui/material";
import { ethers } from "ethers";
import SupraPullService from "../services/supraPullService";
import PriceConsumerABI from "../contracts/abis/PriceConsumer.json";

const PriceFeed = ({ provider, pairIndex, priceConsumerAddress }) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supraPullService = new SupraPullService();

  const fetchAndVerifyPrice = async () => {
    try {
      // Fetch proof from Supra
      const proof = await supraPullService.fetchPriceProofV2([pairIndex]);

      // Get contract instance
      const priceConsumer = new ethers.Contract(
        priceConsumerAddress,
        PriceConsumerABI,
        provider.getSigner()
      );

      // Get price data with verification
      const [priceData, timestamp, round] =
        await priceConsumer.getPriceDataWithRound(proof, pairIndex);

      // Convert price to number considering decimals
      const priceValue = ethers.utils.formatUnits(priceData, 8); // Assuming 8 decimals
      setPrice(priceValue);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching price:", err);
      setError("Failed to fetch verified price");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (provider && priceConsumerAddress) {
      fetchAndVerifyPrice();
      const interval = setInterval(fetchAndVerifyPrice, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [provider, priceConsumerAddress, pairIndex]);

  if (loading) {
    return (
      <Card sx={{ p: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 2, bgcolor: "#ffebee" }}>
        <Typography color="error">{error}</Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Verified Price Feed
      </Typography>
      <Typography variant="h4">
        ${price ? parseFloat(price).toFixed(2) : "N/A"}
      </Typography>
    </Card>
  );
};

export default PriceFeed;
