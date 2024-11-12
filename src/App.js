import React, { useState } from "react";
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import WalletConnect from "./components/WalletConnect";
import BridgeUI from "./components/BridgeUI";
import PriceFeed from "./components/PriceFeed";
import TransactionStatus from "./components/TransactionStatus";
import { Card } from "./components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  const handleConnect = ({ provider: web3Provider, account: userAccount }) => {
    setProvider(web3Provider);
    setAccount(userAccount);
  };

  const handleTransactionUpdate = (transaction) => {
    setCurrentTransaction(transaction);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card className="mb-6">
          <WalletConnect onConnect={handleConnect} />
        </Card>

        {provider && account ? (
          <>
            <div className="mb-6">
              <PriceFeed
                provider={provider}
                pairIndex={0}
                priceConsumerAddress={
                  process.env.REACT_APP_PRICE_CONSUMER_SEPOLIA
                }
              />
            </div>

            <BridgeUI
              provider={provider}
              account={account}
              onTransactionSubmit={handleTransactionUpdate}
            />

            {currentTransaction && (
              <div className="mt-6">
                <TransactionStatus
                  status={currentTransaction.status}
                  sourceChainId={currentTransaction.sourceChainId}
                  destChainId={currentTransaction.destChainId}
                  sourceTxHash={currentTransaction.txHash}
                  destTxHash={currentTransaction.destTxHash}
                />
              </div>
            )}
          </>
        ) : (
          <Alert>
            <AlertTitle>Welcome to Cross-Chain Bridge</AlertTitle>
            <AlertDescription>
              Please connect your wallet to start bridging tokens across
              networks.
            </AlertDescription>
          </Alert>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
