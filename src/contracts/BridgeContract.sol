// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ILayerZeroEndpoint.sol";
import "./PriceConsumer.sol";

contract BridgeContract is Ownable, ReentrancyGuard {
    ILayerZeroEndpoint public immutable lzEndpoint;
    PriceConsumer public immutable priceConsumer;

    mapping(uint16 => bytes) public trustedRemoteLookup;
    mapping(uint16 => uint256) public minDstGasLookup;

    struct BridgeParams {
        uint16 dstChainId;
        bytes toAddress;
        uint256 amount;
        address payable refundAddress;
        address zroPaymentAddress;
        bytes adapterParams;
        bytes priceProof;
    }

    event TokensSent(
        address indexed from,
        uint16 indexed dstChainId,
        bytes toAddress,
        uint256 amount,
        uint256 price
    );

    event TokensReceived(
        address indexed to,
        uint16 indexed srcChainId,
        uint256 amount,
        uint256 price
    );

    constructor(address _lzEndpoint, address _priceConsumer) Ownable() {
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
        priceConsumer = PriceConsumer(_priceConsumer);
    }

    function sendTokens(
        BridgeParams calldata params
    ) external payable nonReentrant {
        require(params.amount > 0, "Invalid amount");
        require(
            trustedRemoteLookup[params.dstChainId].length != 0,
            "Destination chain not trusted"
        );

        // Get the verified price using Supra Oracle
        (uint256 price, , ) = priceConsumer.getPriceDataWithRound(
            params.priceProof,
            0
        );

        bytes memory payload = abi.encode(
            params.toAddress,
            params.amount,
            price
        );

        // Send cross-chain message via LayerZero
        lzEndpoint.send{value: msg.value}(
            params.dstChainId,
            trustedRemoteLookup[params.dstChainId],
            payload,
            params.refundAddress,
            params.zroPaymentAddress,
            params.adapterParams
        );

        emit TokensSent(
            msg.sender,
            params.dstChainId,
            params.toAddress,
            params.amount,
            price
        );
    }

    function estimateFees(
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        bytes calldata _adapterParams
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        bytes memory payload = abi.encode(_toAddress, _amount, 0);
        return
            lzEndpoint.estimateFees(
                _dstChainId,
                address(this),
                payload,
                false,
                _adapterParams
            );
    }

    function setTrustedRemote(
        uint16 _remoteChainId,
        bytes calldata _path
    ) external onlyOwner {
        trustedRemoteLookup[_remoteChainId] = _path;
    }

    function setMinDstGas(
        uint16 _dstChainId,
        uint256 _minGas
    ) external onlyOwner {
        minDstGasLookup[_dstChainId] = _minGas;
    }

    function rescueTokens(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        IERC20(_token).transfer(_to, _amount);
    }
}
