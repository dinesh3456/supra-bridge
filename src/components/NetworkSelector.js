import React from "react";
import { FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import { SUPPORTED_NETWORKS } from "../utils/constants";

const NetworkSelector = ({
  selectedSourceNetwork,
  selectedDestNetwork,
  onSourceNetworkChange,
  onDestNetworkChange,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mb: 3,
      }}
    >
      <FormControl fullWidth>
        <InputLabel>Source Network</InputLabel>
        <Select
          value={selectedSourceNetwork}
          label="Source Network"
          onChange={(e) => onSourceNetworkChange(e.target.value)}
        >
          {SUPPORTED_NETWORKS.map((network) => (
            <MenuItem
              key={network.chainId}
              value={network.chainId}
              disabled={network.chainId === selectedDestNetwork}
            >
              {network.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Destination Network</InputLabel>
        <Select
          value={selectedDestNetwork}
          label="Destination Network"
          onChange={(e) => onDestNetworkChange(e.target.value)}
        >
          {SUPPORTED_NETWORKS.map((network) => (
            <MenuItem
              key={network.chainId}
              value={network.chainId}
              disabled={network.chainId === selectedSourceNetwork}
            >
              {network.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default NetworkSelector;
