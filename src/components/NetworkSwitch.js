import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { SUPPORTED_NETWORKS } from "../utils/constants";

const NetworkSwitch = ({ provider, onNetworkChange }) => {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  const switchNetwork = async (chainId) => {
    if (!provider) return;

    setSwitching(true);
    setError(null);

    try {
      // Get the network configuration
      const network = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
      if (!network) throw new Error("Unsupported network");

      // Request network switch
      try {
        await provider.send("wallet_switchEthereumChain", [
          { chainId: `0x${parseInt(chainId).toString(16)}` },
        ]);
      } catch (switchError) {
        // Network not added to MetaMask
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [
            {
              chainId: `0x${parseInt(chainId).toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorer],
            },
          ]);
        } else {
          throw switchError;
        }
      }

      onNetworkChange && onNetworkChange(chainId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Network Selection</h3>

        <div className="grid grid-cols-2 gap-4">
          {SUPPORTED_NETWORKS.map((network) => (
            <button
              key={network.chainId}
              onClick={() => switchNetwork(network.chainId)}
              disabled={switching}
              className={`
                p-3 rounded-lg border transition-colors
                ${
                  switching
                    ? "bg-gray-100 cursor-not-allowed"
                    : "hover:bg-blue-50"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            >
              <div className="flex items-center justify-center space-x-2">
                {switching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div
                    className={`w-2 h-2 rounded-full bg-${network.name.toLowerCase()}-500`}
                  />
                )}
                <span>{network.name}</span>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Network Switch Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-500">
          <p>Supported Networks:</p>
          <ul className="list-disc list-inside">
            {SUPPORTED_NETWORKS.map((network) => (
              <li key={network.chainId}>
                {network.name} ({network.nativeCurrency.symbol})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default NetworkSwitch;
