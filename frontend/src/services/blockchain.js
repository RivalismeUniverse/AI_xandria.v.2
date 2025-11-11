import { ethers } from 'ethers'

// Contract ABIs (simplified - would be full ABIs in production)
const PERSONA_NFT_ABI = [
  "function mint(string memory name, string memory description, string memory metadataURI) external returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function getPersonasByOwner(address owner) external view returns (uint256[])",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "event PersonaMinted(address indexed owner, uint256 indexed tokenId, string name)"
]

const MARKETPLACE_ABI = [
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function purchaseNFT(uint256 tokenId) external payable",
  "function getListedNFTs() external view returns (tuple(uint256 tokenId, address owner, uint256 price)[])",
  "event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event NFTPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price)"
]

class BlockchainService {
  constructor() {
    this.provider = null
    this.signer = null
    this.personaNFT = null
    this.marketplace = null
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return

    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    try {
      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()

      // Get contract addresses from environment
      const personaNFTAddress = import.meta.env.VITE_CONTRACT_ADDRESS
      const marketplaceAddress = import.meta.env.VITE_MARKETPLACE_ADDRESS

      if (!personaNFTAddress) {
        throw new Error('Contract address not configured')
      }

      // Initialize contracts
      this.personaNFT = new ethers.Contract(
        personaNFTAddress,
        PERSONA_NFT_ABI,
        this.signer
      )

      if (marketplaceAddress) {
        this.marketplace = new ethers.Contract(
          marketplaceAddress,
          MARKETPLACE_ABI,
          this.signer
        )
      }

      this.initialized = true
      console.log('Blockchain service initialized successfully')

    } catch (error) {
      console.error('Failed to initialize blockchain service:', error)
      throw error
    }
  }

  // Persona NFT methods
  async mintPersonaNFT(name, description, metadataURI) {
    if (!this.initialized) await this.initialize()

    try {
      const tx = await this.personaNFT.mint(name, description, metadataURI)
      const receipt = await tx.wait()

      // Extract token ID from event
      const event = receipt.logs.find(log => 
        log.fragment?.name === 'PersonaMinted'
      )
      const tokenId = event?.args?.tokenId?.toString()

      return {
        transactionHash: receipt.hash,
        tokenId: tokenId
      }

    } catch (error) {
      console.error('Error minting NFT:', error)
      throw this.parseBlockchainError(error)
    }
  }

  async getOwnedPersonas(walletAddress = null) {
    if (!this.initialized) await this.initialize()

    try {
      const address = walletAddress || await this.signer.getAddress()
      const tokenIds = await this.personaNFT.getPersonasByOwner(address)
      
      return tokenIds.map(id => id.toString())
    } catch (error) {
      console.error('Error fetching owned personas:', error)
      throw error
    }
  }

  async getPersonaNFTDetails(tokenId) {
    if (!this.initialized) await this.initialize()

    try {
      const [owner, tokenURI] = await Promise.all([
        this.personaNFT.ownerOf(tokenId),
        this.personaNFT.tokenURI(tokenId)
      ])

      return {
        owner,
        tokenURI,
        tokenId: tokenId.toString()
      }
    } catch (error) {
      console.error('Error fetching NFT details:', error)
      throw error
    }
  }

  // Marketplace methods
  async listNFTForSale(tokenId, price) {
    if (!this.initialized) await this.initialize()
    if (!this.marketplace) {
      throw new Error('Marketplace contract not configured')
    }

    try {
      const priceInWei = ethers.parseEther(price.toString())
      const tx = await this.marketplace.listNFT(tokenId, priceInWei)
      const receipt = await tx.wait()

      return {
        transactionHash: receipt.hash
      }
    } catch (error) {
      console.error('Error listing NFT:', error)
      throw this.parseBlockchainError(error)
    }
  }

  async purchaseNFT(tokenId, price) {
    if (!this.initialized) await this.initialize()
    if (!this.marketplace) {
      throw new Error('Marketplace contract not configured')
    }

    try {
      const priceInWei = ethers.parseEther(price.toString())
      const tx = await this.marketplace.purchaseNFT(tokenId, {
        value: priceInWei
      })
      const receipt = await tx.wait()

      return {
        transactionHash: receipt.hash
      }
    } catch (error) {
      console.error('Error purchasing NFT:', error)
      throw this.parseBlockchainError(error)
    }
  }

  async getListedNFTs() {
    if (!this.initialized) await this.initialize()
    if (!this.marketplace) {
      throw new Error('Marketplace contract not configured')
    }

    try {
      return await this.marketplace.getListedNFTs()
    } catch (error) {
      console.error('Error fetching listed NFTs:', error)
      throw error
    }
  }

  // Utility methods
  async getBalance(address = null) {
    if (!this.initialized) await this.initialize()

    try {
      const addr = address || await this.signer.getAddress()
      const balance = await this.provider.getBalance(addr)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error fetching balance:', error)
      throw error
    }
  }

  async getCurrentNetwork() {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    try {
      const network = await this.provider.getNetwork()
      return {
        name: network.name,
        chainId: network.chainId.toString(),
        isSomnia: network.chainId === 50312n // Somnia testnet chain ID
      }
    } catch (error) {
      console.error('Error fetching network:', error)
      throw error
    }
  }

  parseBlockchainError(error) {
    if (error.info && error.info.error) {
      return new Error(error.info.error.message)
    }
    
    if (error.reason) {
      return new Error(error.reason)
    }

    if (error.code === 'ACTION_REJECTED') {
      return new Error('Transaction was rejected')
    }

    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new Error('Insufficient funds for transaction')
    }

    return error
  }

  // Helper to format addresses
  formatAddress(address, start = 6, end = 4) {
    if (!address) return ''
    return `${address.slice(0, start)}...${address.slice(-end)}`
  }
}

export const blockchainService = new BlockchainService()
