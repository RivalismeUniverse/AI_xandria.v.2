const { ethers } = require('ethers');
const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contracts = new Map();
  }

  async mintPersonaNFT(ownerAddress, personaId, metadataURI) {
    try {
      const contract = await this.getNFTContract();
      
      const tx = await contract.mintPersona(
        ownerAddress,
        personaId,
        metadataURI,
        {
          gasLimit: 500000,
          gasPrice: await this.provider.getGasPrice()
        }
      );

      const receipt = await tx.wait();
      logger.info('NFT Minted Successfully', { 
        personaId, 
        txHash: receipt.hash,
        owner: ownerAddress 
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        tokenId: this.extractTokenIdFromReceipt(receipt),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('NFT Minting Error:', error);
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }

  async listPersonaForRent(tokenId, rentalPrice) {
    try {
      const contract = await this.getMarketplaceContract();
      
      const priceInWei = ethers.parseEther(rentalPrice.toString());
      
      const tx = await contract.listForRent(
        tokenId,
        priceInWei,
        {
          gasLimit: 300000,
          gasPrice: await this.provider.getGasPrice()
        }
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        rentalPrice: rentalPrice
      };
    } catch (error) {
      logger.error('Rental Listing Error:', error);
      throw new Error(`Failed to list for rent: ${error.message}`);
    }
  }

  async rentPersona(renterAddress, tokenId, durationDays) {
    try {
      const contract = await this.getMarketplaceContract();
      const rentalInfo = await contract.getRentalInfo(tokenId);
      
      const totalCost = rentalInfo.price * BigInt(durationDays);
      
      const tx = await contract.rentPersona(
        tokenId,
        durationDays,
        {
          value: totalCost,
          gasLimit: 400000,
          gasPrice: await this.provider.getGasPrice()
        }
      );

      const receipt = await tx.wait();
      
      // Distribute payment (80% to owner, 20% to platform)
      await this.distributePayment(rentalInfo.owner, totalCost);
      
      return {
        success: true,
        transactionHash: receipt.hash,
        totalCost: ethers.formatEther(totalCost),
        duration: durationDays
      };
    } catch (error) {
      logger.error('Rental Error:', error);
      throw new Error(`Failed to rent persona: ${error.message}`);
    }
  }

  async uploadToIPFS(metadata) {
    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', 
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.IPFS_API_KEY}`
          }
        }
      );

      return {
        ipfsHash: response.data.IpfsHash,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };
    } catch (error) {
      logger.error('IPFS Upload Error:', error);
      // Fallback to S3
      return await this.uploadToS3(metadata);
    }
  }

  async uploadToS3(metadata) {
    // Will be implemented in S3 service
    return { s3Url: `s3://ai-xandria/metadata/${Date.now()}.json` };
  }

  async getNFTContract() {
    if (!this.contracts.has('nft')) {
      const abi = [
        "function mintPersona(address owner, uint256 personaId, string memory metadataURI) external returns (uint256)",
        "function ownerOf(uint256 tokenId) external view returns (address)",
        "function tokenURI(uint256 tokenId) external view returns (string memory)"
      ];
      
      const contract = new ethers.Contract(
        process.env.NFT_CONTRACT_ADDRESS,
        abi,
        this.wallet
      );
      
      this.contracts.set('nft', contract);
    }
    
    return this.contracts.get('nft');
  }

  async getMarketplaceContract() {
    if (!this.contracts.has('marketplace')) {
      const abi = [
        "function listForRent(uint256 tokenId, uint256 price) external",
        "function rentPersona(uint256 tokenId, uint256 duration) external payable",
        "function getRentalInfo(uint256 tokenId) external view returns (address owner, uint256 price)",
        "event PersonaRented(uint256 indexed tokenId, address indexed renter, uint256 duration)"
      ];
      
      const contract = new ethers.Contract(
        process.env.MARKETPLACE_CONTRACT_ADDRESS,
        abi,
        this.wallet
      );
      
      this.contracts.set('marketplace', contract);
    }
    
    return this.contracts.get('marketplace');
  }

  extractTokenIdFromReceipt(receipt) {
    // Extract token ID from transaction logs
    // Implementation depends on your contract events
    return Math.floor(Math.random() * 10000) + 1; // Placeholder
  }

  async distributePayment(ownerAddress, totalAmount) {
    const ownerShare = totalAmount * BigInt(80) / BigInt(100);
    const platformShare = totalAmount - ownerShare;
    
    // In a real implementation, you'd use a payment splitter contract
    logger.info('Payment Distribution', {
      owner: ownerAddress,
      ownerShare: ethers.formatEther(ownerShare),
      platformShare: ethers.formatEther(platformShare)
    });
    
    return true;
  }

  async verifyOwnership(walletAddress, tokenId) {
    try {
      const contract = await this.getNFTContract();
      const owner = await contract.ownerOf(tokenId);
      return owner.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}

module.exports = new BlockchainService();
