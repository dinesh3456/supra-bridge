const hre = require("hardhat");

async function main() {
  // Get the network
  const network = hre.network.name;

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network);

  let supraOracleAddress, lzEndpointAddress;

  try {
    if (network === "sepolia") {
      supraOracleAddress = "0x39dc1c085ab57e3c5f604a94419cd6d6781b3c0e";
      lzEndpointAddress = "0xae92d5ad7583ad66e49a0c67bad18f6ba52dddc1";
    } else if (network === "mumbai") {
      supraOracleAddress = "0x6890938fa88a54c52f3f5844417a55c4f3d37e53";
      lzEndpointAddress = "0xf69186dfba60ddb133e91e9a4b5673624293d8f8";
    } else {
      throw new Error("Unsupported network");
    }

    // Convert to checksum addresses
    supraOracleAddress = ethers.utils.getAddress(
      supraOracleAddress.toLowerCase()
    );
    lzEndpointAddress = ethers.utils.getAddress(
      lzEndpointAddress.toLowerCase()
    );

    console.log("Using addresses:");
    console.log("Supra Oracle:", supraOracleAddress);
    console.log("LayerZero Endpoint:", lzEndpointAddress);

    // Deploy PriceConsumer
    console.log("\nDeploying PriceConsumer...");
    const PriceConsumer = await ethers.getContractFactory("PriceConsumer");
    const priceConsumer = await PriceConsumer.deploy(supraOracleAddress);
    await priceConsumer.deployed();
    console.log("PriceConsumer deployed to:", priceConsumer.address);

    console.log("Waiting for confirmations...");
    await priceConsumer.deployTransaction.wait(5);

    console.log("\nDeploying Bridge Contract...");
    const Bridge = await ethers.getContractFactory("BridgeContract");
    const bridge = await Bridge.deploy(
      lzEndpointAddress,
      priceConsumer.address
    );
    await bridge.deployed();
    console.log("Bridge Contract deployed to:", bridge.address);

    console.log("Waiting for confirmations...");
    await bridge.deployTransaction.wait(5);

    if (process.env.ETHERSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY) {
      console.log("\nVerifying contracts...");

      try {
        await hre.run("verify:verify", {
          address: priceConsumer.address,
          constructorArguments: [supraOracleAddress],
        });
        console.log("PriceConsumer verified");
      } catch (error) {
        console.log("Error verifying PriceConsumer:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: bridge.address,
          constructorArguments: [lzEndpointAddress, priceConsumer.address],
        });
        console.log("Bridge Contract verified");
      } catch (error) {
        console.log("Error verifying Bridge Contract:", error.message);
      }
    }

    console.log("\nDeployment Summary:");
    console.log("Network:", network);
    console.log("PriceConsumer:", priceConsumer.address);
    console.log("Bridge Contract:", bridge.address);
    console.log("Supra Oracle:", supraOracleAddress);
    console.log("LayerZero Endpoint:", lzEndpointAddress);

    console.log("\nUpdate your .env file with these values:");
    if (network === "sepolia") {
      console.log(`REACT_APP_PRICE_CONSUMER_SEPOLIA=${priceConsumer.address}`);
      console.log(`REACT_APP_BRIDGE_CONTRACT_SEPOLIA=${bridge.address}`);
    } else {
      console.log(`REACT_APP_PRICE_CONSUMER_MUMBAI=${priceConsumer.address}`);
      console.log(`REACT_APP_BRIDGE_CONTRACT_MUMBAI=${bridge.address}`);
    }
  } catch (error) {
    console.error("\nError in deployment:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
