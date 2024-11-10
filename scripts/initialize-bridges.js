const { ethers } = require("hardhat");

async function main() {
  const sepoliaBridgeAddress = process.env.REACT_APP_BRIDGE_CONTRACT_SEPOLIA;
  const mumbaiBridgeAddress = process.env.REACT_APP_BRIDGE_CONTRACT_MUMBAI;

  console.log("Initializing bridge contracts...");
  console.log("Sepolia Bridge:", sepoliaBridgeAddress);
  console.log("Mumbai Bridge:", mumbaiBridgeAddress);

  // Get contract factory
  const Bridge = await ethers.getContractFactory("BridgeContract");

  // Initialize on Sepolia
  console.log("\nInitializing Sepolia bridge...");
  const sepoliaBridge = Bridge.attach(sepoliaBridgeAddress);
  const sepoliaPath = ethers.utils.solidityPack(
    ["address", "address"],
    [sepoliaBridgeAddress, mumbaiBridgeAddress]
  );

  try {
    const tx1 = await sepoliaBridge.setTrustedRemote(
      10109, // Mumbai chain ID in LayerZero
      sepoliaPath
    );
    await tx1.wait();
    console.log("Sepolia bridge initialized");
  } catch (error) {
    console.error("Error initializing Sepolia bridge:", error);
  }

  // Initialize on Mumbai
  console.log("\nInitializing Mumbai bridge...");
  const mumbaiBridge = Bridge.attach(mumbaiBridgeAddress);
  const mumbaiPath = ethers.utils.solidityPack(
    ["address", "address"],
    [mumbaiBridgeAddress, sepoliaBridgeAddress]
  );

  try {
    const tx2 = await mumbaiBridge.setTrustedRemote(
      10161, // Sepolia chain ID in LayerZero
      mumbaiPath
    );
    await tx2.wait();
    console.log("Mumbai bridge initialized");
  } catch (error) {
    console.error("Error initializing Mumbai bridge:", error);
  }

  console.log("\nBridge initialization complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
