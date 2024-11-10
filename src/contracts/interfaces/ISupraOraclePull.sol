// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface ISupraOraclePull {
    struct PriceData {
        uint256[] pairs;
        uint256[] prices;
        uint256[] decimals;
    }

    struct PriceInfo {
        uint256[] pairs;
        uint256[] prices;
        uint256[] timestamp;
        uint256[] decimal;
        uint256[] round;
    }

    function verifyOracleProof(bytes calldata _bytesproof) 
        external 
        returns (PriceData memory);

    function verifyOracleProofV2(bytes calldata _bytesProof) 
        external     
        returns (PriceInfo memory);
}