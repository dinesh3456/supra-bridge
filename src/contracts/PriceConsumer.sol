// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISupraOraclePull.sol";

contract PriceConsumer is Ownable {
    ISupraOraclePull public oracle;
    
    event PriceReceived(uint256 pair, uint256 price, uint256 timestamp, uint256 round);
    
    constructor(address oracleAddress) Ownable() {
        oracle = ISupraOraclePull(oracleAddress);
    }
    
    function getPriceData(bytes calldata _bytesProof, uint256 pair) 
        external 
        returns (uint256 price, uint256 decimals) 
    {
        ISupraOraclePull.PriceData memory prices = oracle.verifyOracleProof(_bytesProof);
        
        for (uint256 i = 0; i < prices.pairs.length; i++) {
            if (prices.pairs[i] == pair) {
                return (prices.prices[i], prices.decimals[i]);
            }
        }
        revert("Pair not found");
    }
    
    function getPriceDataWithRound(bytes calldata _bytesProof, uint256 pair) 
        external 
        returns (uint256 price, uint256 timestamp, uint256 round) 
    {
        ISupraOraclePull.PriceInfo memory prices = oracle.verifyOracleProofV2(_bytesProof);
        
        for (uint256 i = 0; i < prices.pairs.length; i++) {
            if (prices.pairs[i] == pair) {
                price = prices.prices[i];
                timestamp = prices.timestamp[i];
                round = prices.round[i];
                emit PriceReceived(pair, price, timestamp, round);
                return (price, timestamp, round);
            }
        }
        revert("Pair not found");
    }
    
    function updateOracleAddress(address newOracleAddress) external onlyOwner {
        oracle = ISupraOraclePull(newOracleAddress);
    }
}