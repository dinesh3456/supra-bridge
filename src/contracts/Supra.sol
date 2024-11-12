// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface ISupraOraclePull {
    struct PriceData {
        uint256[] pairs;
        uint256[] prices;
        uint256[] decimals;
    }

    function verifyOracleProof(
        bytes calldata _bytesproof
    ) external returns (PriceData memory);
}

contract Supra {
    // The oracle contract
    ISupraOraclePull internal oracle;
    
    // Stores the latest price data for a specific pair
    mapping(uint256 => uint256) public latestPrices;
    mapping(uint256 => uint256) public latestDecimals;
    
    // Event to notify when a price threshold is met
    event PriceThresholdMet(uint256 pairId, uint256 price);
    
    constructor(address oracle_) {
        oracle = ISupraOraclePull(oracle_);
    }
    
    function deliverPriceData(bytes calldata _bytesProof) external {
        ISupraOraclePull.PriceData memory prices = oracle.verifyOracleProof(
            _bytesProof
        );
        
        // Iterate over all the extracted prices and store them
        for (uint256 i = 0; i < prices.pairs.length; i++) {
            uint256 pairId = prices.pairs[i];
            uint256 price = prices.prices[i];
            uint256 decimals = prices.decimals[i];
            
            // Update the latest price and decimals for the pair
            latestPrices[pairId] = price;
            latestDecimals[pairId] = decimals;
            
            // Example utility: Trigger an event if the price meets a certain threshold
            if (price > 1000 * (10 ** decimals)) {
                // Example threshold
                emit PriceThresholdMet(pairId, price);
            }
        }
    }
    
    function updatePullAddress(address oracle_) external {
        oracle = ISupraOraclePull(oracle_);
    }
    
    function getLatestPrice(
        uint256 pairId
    ) external view returns (uint256 price, uint256 decimals) {
        price = latestPrices[pairId];
        decimals = latestDecimals[pairId];
    }
}