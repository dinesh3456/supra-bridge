import React, { useState, useEffect } from "react";
import { Button, Box, Typography } from "@mui/material";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

const WalletConnect = ({ onConnect }) => {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState(null);

  const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
    providerOptions: {},
  });

  const connectWallet = async () => {
    try {
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const accounts = await provider.listAccounts();

      setProvider(provider);
      setAccount(accounts[0]);
      onConnect({ provider, account: accounts[0] });

      // Subscribe to account changes
      instance.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        onConnect({ provider, account: accounts[0] });
      });

      // Subscribe to chain changes
      instance.on("chainChanged", (chainId) => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  return (
    <Box sx={{ mb: 2 }}>
      {!account ? (
        <Button
          variant="contained"
          color="primary"
          onClick={connectWallet}
          sx={{ width: "100%" }}
        >
          Connect Wallet
        </Button>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 1,
          }}
        >
          <Typography>
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              web3Modal.clearCachedProvider();
              setAccount("");
              setProvider(null);
            }}
          >
            Disconnect
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default WalletConnect;
