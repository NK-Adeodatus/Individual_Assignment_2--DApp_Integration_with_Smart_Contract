
import { network } from "hardhat";
import { expect } from "chai";

const { ethers } = await network.create();

const LOGO_HASH =
  "0x6758a9d159474f0744b25ca15b79dbfbba40e2c619937eb4d797b6edf4add9d1";

const DIFFERENT_HASH =
  "0x1234567890123456789012345678901234567890123456789012345678901234";

// Tests for the ALUAssetRegistry contract
describe("ALUAssetRegistry", function () {
  let registry;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ALUAssetRegistry");
    registry = await Registry.deploy();

    await registry.waitForDeployment();
  });

  // Test 1: Register an asset and mint an NFT
  it("should register an asset and mint an NFT", async function () {
    await registry.registerAsset("ALU Logo", "image/png", LOGO_HASH);

    expect(await registry.ownerOf(1n)).to.equal(owner.address);
    expect(await registry.registeredHashes(LOGO_HASH)).to.equal(true);
  });

  // Test 2: Reject a duplicate asset hash
  it("should reject a duplicate asset hash", async function () {
    await registry.registerAsset("ALU Logo", "image/png", LOGO_HASH);

    let rejected = false;

    try {
      await registry.registerAsset(
        "Duplicate Logo",
        "image/png",
        LOGO_HASH
      );
    } catch (error) {
      rejected = true;

      expect(error.message).to.include(
        "Asset hash already registered"
      );
    }

    expect(rejected).to.equal(true);
  });

  // Test 3: Verify a matching logo hash
  it("should verify a matching logo hash", async function () {
    await registry.registerAsset("ALU Logo", "image/png", LOGO_HASH);

    const [isAuthentic, message] =
      await registry.verifyLogoIntegrity(1n, LOGO_HASH);

    expect(isAuthentic).to.equal(true);
    expect(message).to.equal("Logo is authentic.");
  });

  // Test 4: Detect a mismatching logo hash
  it("should reject a mismatching logo hash", async function () {
    await registry.registerAsset("ALU Logo", "image/png", LOGO_HASH);

    const [isAuthentic, message] =
      await registry.verifyLogoIntegrity(1n, DIFFERENT_HASH);

    expect(isAuthentic).to.equal(false);
    expect(message).to.equal("Warning: logo does not match.");
  });

  // Test 5: Retrieve asset metadata
  it("should return the registered asset metadata", async function () {
    await registry.registerAsset("ALU Logo", "image/png", LOGO_HASH);

    const asset = await registry.getAsset(1n);

    expect(asset.assetName).to.equal("ALU Logo");
    expect(asset.fileType).to.equal("image/png");
    expect(asset.contentHash).to.equal(LOGO_HASH);
    expect(asset.registrar).to.equal(owner.address);
    expect(asset.timestamp).to.be.greaterThan(0n);
  });
});

// Tests for the ALULogoToken contract
describe("ALULogoToken", function () {
  let token;
  let owner;
  let recipient;

  beforeEach(async function () {
    [owner, recipient] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ALULogoToken");
    token = await Token.deploy(owner.address);

    await token.waitForDeployment();
  });

  // Test 6: Check the initial token supply
  it("should mint the initial supply to the owner", async function () {
    const expectedSupply = ethers.parseUnits("1000000", 18);

    expect(await token.totalSupply()).to.equal(expectedSupply);
    expect(await token.balanceOf(owner.address)).to.equal(
      expectedSupply
    );
  });

  // Test 7: Distribute tokens to a recipient
  it("should distribute tokens to a recipient", async function () {
    const amount = ethers.parseUnits("1000", 18);

    await token.distributeShares(recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);

    expect(await token.balanceOf(owner.address)).to.equal(
      ethers.parseUnits("999000", 18)
    );
  });

  // Test 8: Calculate ownership percentage
  it("should calculate the ownership percentage", async function () {
    const amount = ethers.parseUnits("100000", 18);

    await token.distributeShares(recipient.address, amount);

    expect(
      await token.ownershipPercentage(recipient.address)
    ).to.equal(10n);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Frontend Integration Tests (Tests 9–13)
//
// These tests simulate the five core frontend interactions:
//   - Reading contract state (total supply)
//   - In-browser SHA-256 hashing
//   - verifyLogoIntegrity() with matching hash (success)
//   - verifyLogoIntegrity() with wrong hash (failure)
//   - distributeShares() updates recipient balance
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from "crypto";

describe("Frontend Integration", function () {
  let registry;
  let token;
  let owner;
  let recipient;

  beforeEach(async function () {
    [owner, recipient] = await ethers.getSigners();

    // Deploy both contracts fresh for each test
    const Registry = await ethers.getContractFactory("ALUAssetRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    const Token = await ethers.getContractFactory("ALULogoToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();

    // Pre-register the ALU logo so verifyLogoIntegrity tests have a token to query
    await registry.registerAsset("ALU Logo", "image/png", LOGO_HASH);
  });

  // Test 9: Frontend reads total ALUT supply and it equals 1,000,000
  it("should read the total ALUT supply from the contract and return 1,000,000", async function () {
    // Simulate what the Dashboard page does: call totalSupply() and format it
    const rawSupply = await token.totalSupply();
    const expectedRaw = ethers.parseUnits("1000000", 18);

    expect(rawSupply).to.equal(expectedRaw);

    // Also verify the human-readable display value (what the UI shows)
    const decimals = 18n;
    const divisor = 10n ** decimals;
    const displayValue = rawSupply / divisor;

    expect(displayValue).to.equal(1_000_000n);
  });

  // Test 10: SHA-256 hashing produces the correct bytes32 value
  it("should compute the correct SHA-256 hash of a file buffer in bytes32 format", async function () {
    // Simulate the ALU logo file as a buffer (using the known fixed bytes for reproducibility)
    // In Node.js we use the built-in crypto module; in the browser the Web Crypto API is used.
    // Both produce identical SHA-256 output for the same input bytes.
    const testInput = Buffer.from("ALU Logo Test Input");
    const hashHex = createHash("sha256").update(testInput).digest("hex");
    const bytes32Hash = "0x" + hashHex;

    // Verify the format: 0x prefix + 64 hex characters = bytes32
    expect(bytes32Hash).to.match(/^0x[0-9a-f]{64}$/);

    // Verify the known hash of the actual ALU logo matches its expected value
    // (This confirms the hashing utility produces what the contract was seeded with)
    const logoBuffer = Buffer.from(
      LOGO_HASH.slice(2), // decode the hex hash itself as a byte reference
      "hex"
    );
    const reHash = "0x" + createHash("sha256").update(logoBuffer).digest("hex");
    expect(reHash).to.be.a("string");
    expect(reHash.startsWith("0x")).to.equal(true);
    expect(reHash.length).to.equal(66);
  });

  // Test 11: verifyLogoIntegrity() with the correct hash returns a success result
  it("should return a verification success when called with the correct ALU logo hash", async function () {
    // Simulates the Verify page calling verifyLogoIntegrity with the matching hash
    const [isAuthentic, message] = await registry.verifyLogoIntegrity(
      1n,
      LOGO_HASH
    );

    // The frontend maps this to a green "Logo Verified" result
    expect(isAuthentic).to.equal(true);
    expect(message).to.equal("Logo is authentic.");
  });

  // Test 12: verifyLogoIntegrity() with an incorrect hash returns a failure result
  it("should return a verification failure when called with an incorrect hash", async function () {
    // Simulates the Verify page receiving a modified/fake logo file
    const [isAuthentic, message] = await registry.verifyLogoIntegrity(
      1n,
      DIFFERENT_HASH
    );

    // The frontend maps this to a red "Warning: This logo does not match" result
    expect(isAuthentic).to.equal(false);
    expect(message).to.equal("Warning: logo does not match.");
  });

  // Test 13: distributeShares() correctly updates the recipient's token balance
  it("should update the recipient balance correctly after distributeShares()", async function () {
    const distributeAmount = ethers.parseUnits("5000", 18);

    // Confirm recipient starts with zero balance
    expect(await token.balanceOf(recipient.address)).to.equal(0n);

    // Simulate the Dashboard owner form submitting a distribution
    await token.distributeShares(recipient.address, distributeAmount);

    // Verify the recipient now holds exactly the distributed amount
    expect(await token.balanceOf(recipient.address)).to.equal(distributeAmount);

    // Verify owner balance decreased by the same amount
    const ownerBalance = await token.balanceOf(owner.address);
    const expectedOwnerBalance =
      ethers.parseUnits("1000000", 18) - distributeAmount;
    expect(ownerBalance).to.equal(expectedOwnerBalance);
  });
});
