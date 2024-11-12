import React from "react";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Loader2, Check, ExternalLink, AlertCircle } from "lucide-react";
import { SUPPORTED_NETWORKS } from "../utils/constants";

const TransactionStatus = ({
  status,
  sourceChainId,
  destChainId,
  sourceTxHash,
  destTxHash,
}) => {
  const getExplorerUrl = (chainId, txHash) => {
    const network = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
    return network ? `${network.blockExplorer}/tx/${txHash}` : "#";
  };

  const renderStatusContent = () => {
    switch (status) {
      case "PENDING":
        return (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Transaction Pending</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>Your transaction is being processed...</p>
                {sourceTxHash && (
                  <a
                    href={getExplorerUrl(sourceChainId, sourceTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    View on Explorer <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                )}
              </div>
            </AlertDescription>
          </Alert>
        );

      case "CONFIRMING":
        return (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Confirming Cross-Chain Transfer</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Transaction confirmed on source chain, waiting for cross-chain
                  confirmation...
                </p>
                <div className="flex flex-col gap-1">
                  <a
                    href={getExplorerUrl(sourceChainId, sourceTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    Source Transaction <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      case "COMPLETED":
        return (
          <Alert className="bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Transfer Completed</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Your cross-chain transfer has been completed successfully!
                </p>
                <div className="flex flex-col gap-1">
                  <a
                    href={getExplorerUrl(sourceChainId, sourceTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    Source Transaction <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                  {destTxHash && (
                    <a
                      href={getExplorerUrl(destChainId, destTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      Destination Transaction{" "}
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );

      case "FAILED":
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Transfer Failed</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  There was an error processing your transfer. Please try again.
                </p>
                {sourceTxHash && (
                  <a
                    href={getExplorerUrl(sourceChainId, sourceTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    View Transaction Details{" "}
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                )}
              </div>
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
  };

  if (!status) {
    return null;
  }

  return <Card className="p-4">{renderStatusContent()}</Card>;
};

export default TransactionStatus;
