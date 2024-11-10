import React from "react";
import { Box, Card, Typography, CircularProgress, Link } from "@mui/material";
import { SUPPORTED_NETWORKS, TRANSACTION_STATUS } from "../utils/constants";

const TransactionStatus = ({
  status,
  sourceChainId,
  destChainId,
  sourceTxHash,
  destTxHash,
}) => {
  const getSourceExplorerUrl = () => {
    const network = SUPPORTED_NETWORKS.find((n) => n.chainId === sourceChainId);
    return network ? `${network.blockExplorer}/tx/${sourceTxHash}` : "#";
  };

  const getDestExplorerUrl = () => {
    const network = SUPPORTED_NETWORKS.find((n) => n.chainId === destChainId);
    return network ? `${network.blockExplorer}/tx/${destTxHash}` : "#";
  };

  const renderStatus = () => {
    switch (status) {
      case TRANSACTION_STATUS.PENDING:
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>Transaction in progres...</Typography>
          </Box>
        );
      case TRANSACTION_STATUS.SUCCESS:
        return (
          <Box sx={{ color: "success.main" }}>
            <Typography>Transaction successful</Typography>
            {sourceTxHash && (
              <Link
                href={getSourceExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on{" "}
                {
                  SUPPORTED_NETWORKS.find((n) => n.chainId === sourceChainId)
                    .name
                }
              </Link>
            )}
            {destTxHash && (
              <Box sx={{ mt: 1 }}>
                <Link
                  href={getDestExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View destination Transaction
                </Link>
              </Box>
            )}
          </Box>
        );

      case TRANSACTION_STATUS.FAILED:
        return (
          <Box sx={{ color: "error.main" }}>
            <Typography>Transaction failed</Typography>
            {sourceTxHash && (
              <Link
                href={getSourceExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction details
              </Link>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  if (!status || status === TRANSACTION_STATUS.NONE) {
    return null;
  }

  return <Card sx={{ p: 2, mt: 2 }}>{renderStatus()}</Card>;
};

export default TransactionStatus;
