const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Contract ABIs (simplified - import full ABI in production)
const PERSONA_NFT_ABI = [
  "function mintPersona(address creator, string personaId, string name, uint256 intelligence, uint256 creativity, uint256 persuasiveness, uint256 totalBattles, uint256 totalWins, uint256 eloRating, string metadataURI) returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event PersonaMinted(uint256 indexed tokenId, address indexed creator, string personaId, string metadataURI)"
];

const MARKETPLACE_ABI = [
  "function listPersona(uint256 tokenId, uint256 price)",
  "function buyPersona(uint256 tokenId)",
  "function cancelListing(uint256 tokenId)",
  "function getListing(uint256 tokenId) view returns (address seller, uint256 price, bool active)"
];

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC || 'https://rpc.somnia.network/testnet'
    );
    
    this.wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      this.provider
    );

    this.personaNFTAddress = process.env.CONTRACT_ADDRESS;
    this.marketplaceAddress = process.env.MARKETPLACE_CONTRACT;

    this.personaNFT = new ethers.Contract(
      this.personaNFTAddress,
      PERSONA_NFT_ABI,
      this.wallet
    );

    this.marketplace = new ethers.Contract(
      this.marketplaceAddress,
      MARKETPLACE_ABI,
      this.wallet
    );
  }

  /**
   * Mint persona as NFT on Somnia blockchain
   */
  async mintPersonaNFT(creatorAddress, personaId, metadataURI, metadata) {
    try {
      logger.info('Minting NFT...', { personaId, creator: creatorAddress });

      const tx = await this.personaNFT.mintPersona(
        creatorAddress,
        personaId,
        metadata.name,
        metadata.attributes.find(a => a.trait_type === 'Intelligence').value,
        metadata.attributes.find(a => a.trait_type === 'Creativity').value,
        metadata.attributes.find(a => a.trait_type === 'Persuasiveness').value,
        metadata.attributes.find(a => a.trait_type === 'Total Battles').value,
        metadata.attributes.find(a => a.trait_type === 'Total Wins').value,
        metadata.attributes.find(a => a.trait_type === 'ELO Rating').value,
        metadataURI
      );

      const receipt = await tx.wait();

      // Extract tokenId from event
      const mintEvent = receipt.logs.find(
        log => log.eventName === 'PersonaMinted'
      );
      
      const tokenId = mintEvent ? Number(mintEvent.args[0]) : null;

      logger.info('NFT minted successfully', {
        tokenId,
        txHash: receipt.hash,
        personaId
      });

      return {
        tokenId,
        txHash: receipt.hash,
        contractAddress: this.personaNFTAddress
      };
    } catch (error) {
      logger.error('NFT minting failed:', error);
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }

  /**
   * Verify NFT ownership
   */
  async verifyNFTOwnership(tokenId, address) {
    try {
      const owner = await this.personaNFT.ownerOf(tokenId);
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      logger.error('Ownership verification failed:', error);
      return false;
    }
  }

  /**
   * Get NFT metadata URI
   */
  async getTokenURI(tokenId) {
    try {
      return await this.personaNFT.tokenURI(tokenId);
    } catch (error) {
      logger.error('Failed to get token URI:', error);
      return null;
    }
  }

  /**
   * List NFT on marketplace
   */
  async listNFT(tokenId, priceInSTT) {
    try {
      const priceInWei = ethers.parseEther(priceInSTT.toString());
      
      const tx = await this.marketplace.listPersona(tokenId, priceInWei);
      const receipt = await tx.wait();

      logger.info('NFT listed on marketplace', {
        tokenId,
        price: priceInSTT,
        txHash: receipt.hash
      });

      return {
        txHash: receipt.hash,
        success: true
      };
    } catch (error) {
      logger.error('Marketplace listing failed:', error);
      throw new Error(`Failed to list NFT: ${error.message}`);
    }
  }

  /**
   * Buy NFT from marketplace
   */
  async buyNFT(tokenId, paymentTxHash) {
    try {
      // In production, verify payment first
      
      const tx = await this.marketplace.buyPersona(tokenId);
      const receipt = await tx.wait();

      logger.info('NFT purchased', {
        tokenId,
        txHash: receipt.hash,
        paymentTxHash
      });

      return {
        txHash: receipt.hash,
        success: true
      };
    } catch (error) {
      logger.error('NFT purchase failed:', error);
      throw new Error(`Failed to buy NFT: ${error.message}`);
    }
  }

  /**
   * Transfer NFT
   */
  async transferNFT(tokenId, toAddress, paymentTxHash) {
    try {
      // Simplified - in production, handle through marketplace contract
      logger.info('NFT transfer initiated', {
        tokenId,
        to: toAddress,
        paymentTxHash
      });

      return {
        success: true,
        txHash: paymentTxHash // Use payment tx as reference
      };
    } catch (error) {
      logger.error('NFT transfer failed:', error);
      throw new Error(`Failed to transfer NFT: ${error.message}`);
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei'),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
      };
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get balance:', error);
      return '0';
    }
  }
}

module.exports = new BlockchainService();
