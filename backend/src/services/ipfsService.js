// backend/src/services/ipfsService.js
// IPFS service for uploading persona metadata and assets
// Uses Pinata as IPFS provider

const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

class IPFSService {
  constructor() {
    this.pinataApiUrl = 'https://api.pinata.cloud';
    
    // Setup axios instance with authentication
    this.axiosInstance = axios.create({
      baseURL: this.pinataApiUrl,
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(metadata) {
    try {
      logger.info('Uploading JSON metadata to IPFS');

      const response = await this.axiosInstance.post('/pinning/pinJSONToIPFS', {
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}_metadata.json`,
          keyvalues: {
            type: 'persona_metadata',
            persona_name: metadata.name
          }
        }
      });

      const ipfsHash = response.data.IpfsHash;
      const ipfsUrl = `ipfs://${ipfsHash}`;
      const gatewayUrl = `${PINATA_GATEWAY}${ipfsHash}`;

      logger.info(`JSON uploaded successfully. IPFS Hash: ${ipfsHash}`);

      return {
        ipfsHash,
        ipfsUrl,
        gatewayUrl,
        metadata
      };
    } catch (error) {
      logger.error('Error uploading JSON to IPFS:', error.response?.data || error.message);
      throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(fileBuffer, fileName, contentType) {
    try {
      logger.info(`Uploading file to IPFS: ${fileName}`);

      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: contentType
      });

      const metadata = JSON.stringify({
        name: fileName,
        keyvalues: {
          type: 'persona_asset'
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await this.axiosInstance.post(
        '/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders()
          }
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const ipfsUrl = `ipfs://${ipfsHash}`;
      const gatewayUrl = `${PINATA_GATEWAY}${ipfsHash}`;

      logger.info(`File uploaded successfully. IPFS Hash: ${ipfsHash}`);

      return {
        ipfsHash,
        ipfsUrl,
        gatewayUrl
      };
    } catch (error) {
      logger.error('Error uploading file to IPFS:', error.response?.data || error.message);
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload persona avatar image
   */
  async uploadPersonaAvatar(personaId, imageBuffer) {
    try {
      const fileName = `persona_${personaId}_avatar.png`;
      return await this.uploadFile(imageBuffer, fileName, 'image/png');
    } catch (error) {
      logger.error('Error uploading persona avatar:', error);
      throw error;
    }
  }

  /**
   * Get content from IPFS
   */
  async getContent(ipfsHash) {
    try {
      logger.info(`Fetching content from IPFS: ${ipfsHash}`);

      const url = `${PINATA_GATEWAY}${ipfsHash}`;
      const response = await axios.get(url);

      return response.data;
    } catch (error) {
      logger.error('Error fetching IPFS content:', error);
      throw new Error(`Failed to fetch IPFS content: ${error.message}`);
    }
  }

  /**
   * Pin existing IPFS hash (if not using Pinata)
   */
  async pinByHash(ipfsHash, name) {
    try {
      logger.info(`Pinning IPFS hash: ${ipfsHash}`);

      const response = await this.axiosInstance.post('/pinning/pinByHash', {
        hashToPin: ipfsHash,
        pinataMetadata: {
          name: name || ipfsHash
        }
      });

      logger.info(`Hash pinned successfully: ${ipfsHash}`);

      return response.data;
    } catch (error) {
      logger.error('Error pinning hash:', error.response?.data || error.message);
      throw new Error(`Failed to pin hash: ${error.message}`);
    }
  }

  /**
   * Unpin content from IPFS
   */
  async unpin(ipfsHash) {
    try {
      logger.info(`Unpinning IPFS hash: ${ipfsHash}`);

      await this.axiosInstance.delete(`/pinning/unpin/${ipfsHash}`);

      logger.info(`Hash unpinned successfully: ${ipfsHash}`);

      return { success: true, ipfsHash };
    } catch (error) {
      logger.error('Error unpinning hash:', error.response?.data || error.message);
      throw new Error(`Failed to unpin hash: ${error.message}`);
    }
  }

  /**
   * List pinned files
   */
  async listPinned(limit = 10, offset = 0) {
    try {
      const response = await this.axiosInstance.get('/data/pinList', {
        params: {
          status: 'pinned',
          pageLimit: limit,
          pageOffset: offset
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error listing pinned files:', error.response?.data || error.message);
      throw new Error(`Failed to list pinned files: ${error.message}`);
    }
  }

  /**
   * Test IPFS connection
   */
  async testConnection() {
    try {
      const response = await this.axiosInstance.get('/data/testAuthentication');
      
      logger.info('IPFS connection test successful');
      
      return {
        connected: true,
        message: response.data.message
      };
    } catch (error) {
      logger.error('IPFS connection test failed:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Generate full NFT metadata structure
   */
  generateNFTMetadata(persona, imageUrl) {
    return {
      name: persona.name,
      description: `${persona.name} - An autonomous AI persona from AI_XANDRIA. This NFT represents a self-evolving AI agent with unique personality traits and battle history.`,
      image: imageUrl,
      external_url: `https://aixandria.io/persona/${persona.id}`,
      
      // OpenSea attributes format
      attributes: [
        {
          trait_type: "Type",
          value: persona.type
        },
        {
          trait_type: "Rating",
          value: persona.rating,
          display_type: "number"
        },
        {
          trait_type: "Total Battles",
          value: persona.total_battles,
          display_type: "number"
        },
        {
          trait_type: "Battle Wins",
          value: persona.battle_wins,
          display_type: "number"
        },
        {
          trait_type: "Win Rate",
          value: persona.total_battles > 0 
            ? Math.round((persona.battle_wins / persona.total_battles) * 100)
            : 0,
          display_type: "number"
        },
        {
          trait_type: "Total Chats",
          value: persona.total_chats,
          display_type: "number"
        },
        // Personality traits
        ...Object.entries(persona.personality.traits || {}).map(([key, value]) => ({
          trait_type: key.charAt(0).toUpperCase() + key.slice(1),
          value: value,
          max_value: 100
        }))
      ],

      // Additional properties
      properties: {
        created_at: persona.created_at,
        persona_id: persona.id,
        expertise: persona.personality.expertise || [],
        tone: persona.personality.tone || "neutral"
      }
    };
  }
}

// Export singleton instance
module.exports = new IPFSService();
