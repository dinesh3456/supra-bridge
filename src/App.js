import React, { useState } from "react";
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import WalletConnect from "./components/WalletConnect";
import TokenBridge from "./components/TokenBridge";
import { BridgeProvider } from "./contexts/BridgeContext";

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

  const handleConnect = ({ provider, account }) => {
    setProvider(provider);
    setAccount(account);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BridgeProvider>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <WalletConnect onConnect={handleConnect} />
          {provider && account && (
            <TokenBridge provider={provider} account={account} />
          )}
        </Container>
      </BridgeProvider>
    </ThemeProvider>
  );
}

export default App;
