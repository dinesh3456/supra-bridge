import axios from "axios";
import { ethers } from "ethers";

const SUPRA_ORACLE_ABI = [
  "function getPrice(bytes32 pair) view returns (uint256)",
  "function getRoundData(bytes32 pair) view returns (uint256, uint256, uint256)",
  "function getDerivedPrice(bytes32 base, bytes32 quote, uint8 decimals) view returns (uint256)",
];

export const getSupraPriceFeed = (address, provider) => {
  return new ethers.Contract(address, SUPRA_ORACLE_ABI, provider);
};

export const fetchPriceFromAPI = async (symbol) => {
  try {
    const response = await axios.get(
      `https://api.supraoracles.com/v1/prices/${symbol}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_SUPRA_API_KEY}`,
        },
      }
    );
    return response.data.price;
  } catch (error) {
    console.error("Error fetching price from SupraOracles API:", error);
    throw error;
  }
};

export const getPriceFromContract = async (priceFeedContract, pair) => {
  try {
    const price = await priceFeedContract.getPrice(
      ethers.utils.formatBytes32String(pair)
    );
    return ethers.utils.formatUnits(price, 8); // Assuming 8 decimals
  } catch (error) {
    console.error("Error getting price from contract:", error);
    throw error;
  }
};

export const getRoundData = async (priceFeedContract, pair) => {
  try {
    const [price, timestamp, roundId] = await priceFeedContract.getRoundData(
      ethers.utils.formatBytes32String(pair)
    );
    return {
      price: ethers.utils.formatUnits(price, 8),
      timestamp: timestamp.toString(),
      roundId: roundId.toString(),
    };
  } catch (error) {
    console.error("Error getting round data:", error);
    throw error;
  }
};
