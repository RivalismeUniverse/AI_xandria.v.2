// frontend/src/services/blockchain.js
// Blockchain interaction service for Somnia Network
// 🤖 Built with Amazon Q Developer assistance

import { ethers } from 'ethers';

// Contract ABIs (simplified)
const PERSONA_NFT_ABI = [
  'function mint(address to, string memory tokenURI) public returns (uint256)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function balanceOf(address owner) public view returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string memory)',
  'function approve(address to, uint256 tokenId) public',
  'function transferFrom(address from, address to, uint256 tokenId) public',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

const MARKETPLACE_ABI = [
  'function listNFT(uint256 tokenId, uint256 price) public',
  'function buyNFT(uint256 tokenId) public payable',
  'function cancelListing(uint256 tokenId) public',
  'function getListing(uint256 tokenId) public view returns (address seller, uint256 price, bool isActive)',
  'event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)',
  'event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price)'
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.nftContract = null;
    this.marketplaceContract = null;
    this.initialized = false;
  }

  /**
   * Initialize blockchain service
   */
  async initialize(provider) {
    try {
      this.provider = provider;

      const nftAddress = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
      const marketplaceAddress = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;

      if (nftAddress) {
        this.nftContract = new ethers.Contract(
          nftAddress,
          PERSONA_NFT_ABI,
          provider
        );
      }

      if (marketplaceAddress) {
        this.marketplaceContract = new ethers.Contract(
          marketplaceAddress,
          MARKETPLACE_ABI,
          provider
        );
      }

      this.initialized = true;
      console.log('✅ Blockchain service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Get NFT owner
   */
  async getNFTOwner(tokenId) {
    if (!this.nftContract) throw new Error('NFT contract not initialized');

    try {
      const owner = await this.nftContract.ownerOf(tokenId);
      return owner;
    } catch (error) {
      console.error('Error getting NFT owner:', error);
      throw error;
    }
  }

  /**
   * Get NFT balance of address
   */
  async getNFTBalance(address) {
    if (!this.nftContract) throw new Error('NFT contract not initialized');

    try {
      const balance = await this.nftContract.balanceOf(address);
      return balance.toString();
    } catch (error) {
      console.error('Error getting NFT balance:', error);
      throw error;
    }
  }

  /**
   * Get NFT metadata URI
   */
  async getTokenURI(tokenId) {
    if (!this.nftContract) throw new Error('NFT contract not initialized');

    try {
      const uri = await this.nftContract.tokenURI(tokenId);
      return uri;
    } catch (error) {
      console.error('Error getting token URI:', error);
      throw error;
    }
  }

  /**
   * Mint NFT (requires signer)
   */
  async mintNFT(signer, toAddress, metadataURI) {
    if (!this.nftContract) throw new Error('NFT contract not initialized');

    try {
      const contractWithSigner = this.nftContract.connect(signer);
      const tx = await contractWithSigner.mint(toAddress, metadataURI);
      
      console.log('⏳ Minting NFT... Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      
      // Extract token ID from event
      const transferEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'Transfer'
      );
      
      const tokenId = transferEvent ? transferEvent.args.tokenId.toString() : null;
      
      console.log('✅ NFT minted! Token ID:', tokenId);
      
      return {
        tokenId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  /**
   * Approve marketplace to transfer NFT
   */
  async approveMarketplace(signer, tokenId) {
    if (!this.nftContract || !this.marketplaceContract) {
      throw new Error('Contracts not initialized');
    }

    try {
      const contractWithSigner = this.nftContract.connect(signer);
      const tx = await contractWithSigner.approve(
        this.marketplaceContract.address,
        tokenId
      );
      
      await tx.wait();
      console.log('✅ Marketplace approved for token', tokenId);
      
      return tx;
    } catch (error) {
      console.error('Error approving marketplace:', error);
      throw error;
    }
  }

  /**
   * List NFT on marketplace
   */
  async listNFT(signer, tokenId, priceInSTT) {
    if (!this.marketplaceContract) throw new Error('Marketplace contract not initialized');

    try {
      // First approve marketplace
      await this.approveMarketplace(signer, tokenId);

      // Then list NFT
      const priceInWei = ethers.parseEther(priceInSTT.toString());
      const contractWithSigner = this.marketplaceContract.connect(signer);
      
      const tx = await contractWithSigner.listNFT(tokenId, priceInWei);
      
      console.log('⏳ Listing NFT... Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      
      console.log('✅ NFT listed successfully!');
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error listing NFT:', error);
      throw error;
    }
  }

  /**
   * Buy NFT from marketplace
   */
  async buyNFT(signer, tokenId, priceInSTT) {
    if (!this.marketplaceContract) throw new Error('Marketplace contract not initialized');

    try {
      const priceInWei = ethers.parseEther(priceInSTT.toString());
      const contractWithSigner = this.marketplaceContract.connect(signer);
      
      const tx = await contractWithSigner.buyNFT(tokenId, {
        value: priceInWei
      });
      
      console.log('⏳ Purchasing NFT... Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      
      console.log('✅ NFT purchased successfully!');
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error buying NFT:', error);
      throw error;
    }
  }

  /**
   * Cancel NFT listing
   */
  async cancelListing(signer, tokenId) {
    if (!this.marketplaceContract) throw new Error('Marketplace contract not initialized');

    try {
      const contractWithSigner = this.marketplaceContract.connect(signer);
      const tx = await contractWithSigner.cancelListing(tokenId);
      
      await tx.wait();
      console.log('✅ Listing cancelled for token', tokenId);
      
      return tx;
    } catch (error) {
      console.error('Error cancelling listing:', error);
      throw error;
    }
  }

  /**
   * Get marketplace listing details
   */
  async getListing(tokenId) {
    if (!this.marketplaceContract) throw new Error('Marketplace contract not initialized');

    try {
      const [seller, price, isActive] = await this.marketplaceContract.getListing(tokenId);
      
      return {
        seller,
        price: ethers.formatEther(price),
        isActive
      };
    } catch (error) {
      console.error('Error getting listing:', error);
      throw error;
    }
  }

  /**
   * Send STT tokens
   */
  async sendSTT(signer, toAddress, amountInSTT) {
    try {
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amountInSTT.toString())
      });

      console.log('⏳ Sending STT... Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      
      console.log('✅ STT sent successfully!');
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error sending STT:', error);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash, confirmations = 1) {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      console.log(`⏳ Waiting for ${confirmations} confirmation(s)...`);
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      console.log('✅ Transaction confirmed!');
      return receipt;
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei'),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new BlockchainService();
