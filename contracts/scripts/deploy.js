const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying AI_XANDRIA contracts to Somnia Testnet...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${(await deployer.getBalance()).toString()}`);

  // Deploy PersonaNFT contract
  console.log("\n📜 Deploying PersonaNFT...");
  const PersonaNFT = await ethers.getContractFactory("PersonaNFT");
  const personaNFT = await PersonaNFT.deploy();
  await personaNFT.deployed();
  console.log(`✅ PersonaNFT deployed to: ${personaNFT.address}`);

  // Deploy Marketplace contract
  console.log("\n🏪 Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(personaNFT.address, deployer.address);
  await marketplace.deployed();
  console.log(`✅ Marketplace deployed to: ${marketplace.address}`);

  // Deploy BattleArena contract
  console.log("\n⚔️ Deploying BattleArena...");
  const BattleArena = await ethers.getContractFactory("BattleArena");
  const battleArena = await BattleArena.deploy(personaNFT.address);
  await battleArena.deployed();
  console.log(`✅ BattleArena deployed to: ${battleArena.address}`);

  // Deploy ChatPayment contract
  console.log("\n💬 Deploying ChatPayment...");
  const ChatPayment = await ethers.getContractFactory("ChatPayment");
  const chatPayment = await ChatPayment.deploy(personaNFT.address, deployer.address);
  await chatPayment.deployed();
  console.log(`✅ ChatPayment deployed to: ${chatPayment.address}`);

  // Save deployment addresses to file
  const deploymentInfo = {
    network: "somnia-testnet",
    chainId: 50312,
    contracts: {
      personaNFT: personaNFT.address,
      marketplace: marketplace.address,
      battleArena: battleArena.address,
      chatPayment: chatPayment.address
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "somnia-testnet.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log(`   PersonaNFT: ${personaNFT.address}`);
  console.log(`   Marketplace: ${marketplace.address}`);
  console.log(`   BattleArena: ${battleArena.address}`);
  console.log(`   ChatPayment: ${chatPayment.address}`);

  // Verify contracts on block explorer (if available)
  console.log("\n🔍 Verifying contracts...");
  try {
    await run("verify:verify", {
      address: personaNFT.address,
      constructorArguments: [],
    });
    console.log("✅ PersonaNFT verified");
  } catch (error) {
    console.log("⚠️  PersonaNFT verification failed:", error.message);
  }

  // Save to .env file for backend
  const envContent = `
# Smart Contract Addresses (Somnia Testnet)
NFT_CONTRACT_ADDRESS=${personaNFT.address}
MARKETPLACE_CONTRACT_ADDRESS=${marketplace.address}
BATTLE_ARENA_CONTRACT_ADDRESS=${battleArena.address}
CHAT_PAYMENT_CONTRACT_ADDRESS=${chatPayment.address}
  `.trim();

  fs.writeFileSync(path.join(__dirname, "../.env.contracts"), envContent);
  console.log("\n📄 Contract addresses saved to .env.contracts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
