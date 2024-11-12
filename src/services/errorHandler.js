export class BridgeError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "BridgeError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const ErrorCodes = {
  // Network Errors
  NETWORK_ERROR: "NETWORK_ERROR",
  CHAIN_NOT_SUPPORTED: "CHAIN_NOT_SUPPORTED",
  WRONG_NETWORK: "WRONG_NETWORK",

  // Contract Errors
  CONTRACT_ERROR: "CONTRACT_ERROR",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  EXECUTION_REVERTED: "EXECUTION_REVERTED",

  // LayerZero Errors
  LZ_ERROR: "LZ_ERROR",
  LZ_FEES_ERROR: "LZ_FEES_ERROR",
  LZ_MESSAGE_FAILED: "LZ_MESSAGE_FAILED",

  // Price Feed Errors
  PRICE_FEED_ERROR: "PRICE_FEED_ERROR",
  PRICE_VERIFICATION_FAILED: "PRICE_VERIFICATION_FAILED",

  // Transaction Errors
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  TRANSACTION_TIMEOUT: "TRANSACTION_TIMEOUT",

  // Validation Errors
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_ADDRESS: "INVALID_ADDRESS",
  INVALID_PARAMETERS: "INVALID_PARAMETERS",
};

export class ErrorHandler {
  static parseError(error) {
    // Ethereum provider errors
    if (error.code && error.message) {
      switch (error.code) {
        case 4001:
          return new BridgeError(
            "Transaction rejected by user",
            ErrorCodes.TRANSACTION_FAILED,
            { originalError: error }
          );
        case -32603:
          if (error.message.includes("insufficient funds")) {
            return new BridgeError(
              "Insufficient funds for transaction",
              ErrorCodes.INSUFFICIENT_FUNDS,
              { originalError: error }
            );
          }
          break;
        default:
          break;
      }
    }

    // LayerZero specific errors
    if (error.message?.includes("LayerZero")) {
      return new BridgeError(
        "LayerZero transaction failed",
        ErrorCodes.LZ_ERROR,
        { originalError: error }
      );
    }

    // Contract execution errors
    if (error.message?.includes("execution reverted")) {
      return new BridgeError(
        "Contract execution reverted",
        ErrorCodes.EXECUTION_REVERTED,
        { originalError: error }
      );
    }

    // Network errors
    if (error.message?.includes("network")) {
      return new BridgeError(
        "Network error occurred",
        ErrorCodes.NETWORK_ERROR,
        { originalError: error }
      );
    }

    // Default error
    return new BridgeError(
      error.message || "Unknown error occurred",
      ErrorCodes.CONTRACT_ERROR,
      { originalError: error }
    );
  }

  static async handleError(error, context = {}) {
    const parsedError = this.parseError(error);

    // Log the error
    console.error("Bridge Error:", {
      code: parsedError.code,
      message: parsedError.message,
      details: parsedError.details,
      context,
      timestamp: parsedError.timestamp,
    });

    return parsedError;
  }

  static isUserRejection(error) {
    return (
      error.code === ErrorCodes.TRANSACTION_FAILED &&
      error.message.includes("rejected")
    );
  }

  static isInsufficientFunds(error) {
    return error.code === ErrorCodes.INSUFFICIENT_FUNDS;
  }

  static isNetworkError(error) {
    return error.code === ErrorCodes.NETWORK_ERROR;
  }

  static getUserFriendlyMessage(error) {
    switch (error.code) {
      case ErrorCodes.INSUFFICIENT_FUNDS:
        return "Insufficient funds to complete the transaction. Please ensure you have enough tokens and gas.";

      case ErrorCodes.WRONG_NETWORK:
        return "Please switch to the correct network to proceed with the transaction.";

      case ErrorCodes.TRANSACTION_FAILED:
        return "Transaction failed. Please try again.";

      case ErrorCodes.PRICE_FEED_ERROR:
        return "Unable to fetch current price data. Please try again later.";

      case ErrorCodes.LZ_ERROR:
        return "Cross-chain message delivery failed. Please try again.";

      default:
        return "An error occurred. Please try again later.";
    }
  }
}
