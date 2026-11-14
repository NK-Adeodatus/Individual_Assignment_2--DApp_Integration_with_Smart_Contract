
import { network } from "hardhat";

const LOGO_HASH =
  "0x6758a9d159474f0744b25ca15b79dbfbba40e2c619937eb4d797b6edf4add9d1";

const ASSET_NAME = "ALU Logo";
const FILE_TYPE = "image/png";

const { ethers } = await network.create();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  // Deploy the NFT registry contract.
  const Registry = await ethers.getContractFactory("ALUAssetRegistry");
  const registry = await Registry.deploy();

  await registry.waitForDeployment();

  console.log("ALUAssetRegistry deployed to:", await registry.getAddress());

  // Register the actual ALU logo.
  const registerTx = await registry.registerAsset(
    ASSET_NAME,
    FILE_TYPE,
    LOGO_HASH
  );

  await registerTx.wait();

  console.log("ALU logo registered successfully.");

  // Deploy the ERC-20 token contract.
  const Token = await ethers.getContractFactory("ALULogoToken");
  const token = await Token.deploy(deployer.address);

  await token.waitForDeployment();

  console.log("ALULogoToken deployed to:", await token.getAddress());

  console.log("Initial token supply:", (await token.totalSupply()).toString());
  console.log("Logo NFT owner:", await registry.ownerOf(1n));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
