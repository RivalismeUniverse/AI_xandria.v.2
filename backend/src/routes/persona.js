const express = require('express');
const router = express.Router();
const AWSBedrockService = require('../services/aws-bedrock-service');
const BlockchainService = require('../services/blockchainService');
const S3Service = require('../services/s3-service');
const { Persona, User } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Create new AI persona
router.post('/create', auth, async (req, res) => {
  try {
    const { prompt, traits, name, description } = req.body;
    const walletAddress = req.walletAddress;

    // Generate persona using AWS Bedrock
    const personaData = await AWSBedrockService.createPersonaFromPrompt(prompt, traits);
    
    // Create persona in database
    const persona = await Persona.create({
      owner_address: walletAddress,
      name: name || personaData.name,
      description: description || personaData.description,
      prompt_text: prompt,
      traits: personaData.initial_traits,
      personality: personaData.personality,
      expertise: personaData.expertise,
      created_date: new Date()
    });

    // Prepare metadata for IPFS
    const metadata = {
      personaId: persona.id,
      name: persona.name,
      description: persona.description,
      traits: persona.traits,
      personality: persona.personality,
      expertise: persona.expertise,
      createdBy: walletAddress,
      createdAt: persona.created_date
    };

    // Upload to IPFS and S3
    const ipfsResult = await BlockchainService.uploadToIPFS(metadata);
    const s3Result = await S3Service.uploadPersonaMetadata(persona.id, metadata);

    // Update persona with storage references
    await persona.update({
      ipfs_hash: ipfsResult.ipfsHash
    });

    // Update user stats
    await User.increment('persona_count', {
      where: { wallet_address: walletAddress }
    });

    logger.info('Persona Created Successfully', { 
      personaId: persona.id, 
      owner: walletAddress 
    });

    res.json({
      success: true,
      persona: {
        ...persona.toJSON(),
        ipfsUrl: ipfsResult.ipfsUrl,
        s3Url: s3Result.s3Url
      }
    });

  } catch (error) {
    logger.error('Persona Creation Route Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mint persona as NFT
router.post('/:id/mint', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const walletAddress = req.walletAddress;

    const persona = await Persona.findOne({
      where: { id, owner_address: walletAddress }
    });

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found or not owned by you'
      });
    }

    if (persona.token_id) {
      return res.status(400).json({
        success: false,
        error: 'Persona already minted as NFT'
      });
    }

    // Prepare NFT metadata
    const metadata = {
      name: persona.name,
      description: persona.description,
      image: `https://ai-xandria.com/personas/${persona.id}/avatar.png`,
      attributes: [
        {
          trait_type: "Intelligence",
          value: persona.traits.intelligence
        },
        {
          trait_type: "Creativity", 
          value: persona.traits.creativity
        },
        {
          trait_type: "Persuasiveness",
          value: persona.traits.persuasiveness
        },
        {
          trait_type: "Battle Wins",
          value: persona.battle_wins
        },
        {
          trait_type: "Rating",
          value: persona.rating
        }
      ],
      external_url: `https://ai-xandria.com/personas/${persona.id}`,
      background_color: "000000"
    };

    // Upload metadata to IPFS
    const ipfsResult = await BlockchainService.uploadToIPFS(metadata);

    // Mint NFT
    const mintResult = await BlockchainService.mintPersonaNFT(
      walletAddress,
      persona.id,
      ipfsResult.ipfsUrl
    );

    // Update persona with NFT info
    await persona.update({
      token_id: mintResult.tokenId,
      contract_address: process.env.NFT_CONTRACT_ADDRESS
    });

    res.json({
      success: true,
      nft: {
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        ipfsUrl: ipfsResult.ipfsUrl,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS
      }
    });

  } catch (error) {
    logger.error('NFT Minting Route Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's personas
router.get('/my-personas', auth, async (req, res) => {
  try {
    const walletAddress = req.walletAddress;
    
    const personas = await Persona.findAll({
      where: { owner_address: walletAddress },
      order: [['created_date', 'DESC']]
    });

    res.json({
      success: true,
      personas: personas.map(p => p.toJSON()),
      count: personas.length
    });

  } catch (error) {
    logger.error('Get Personas Route Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get persona by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const persona = await Persona.findByPk(id);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    res.json({
      success: true,
      persona: persona.toJSON()
    });

  } catch (error) {
    logger.error('Get Persona Route Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update persona rental status
router.patch('/:id/rental', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_rentable, rental_price } = req.body;
    const walletAddress = req.walletAddress;

    const persona = await Persona.findOne({
      where: { id, owner_address: walletAddress }
    });

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found or not owned by you'
      });
    }

    if (is_rentable && persona.token_id) {
      // List on blockchain marketplace
      await BlockchainService.listPersonaForRent(persona.token_id, rental_price);
    }

    await persona.update({
      is_rentable,
      rental_price: rental_price || 0
    });

    res.json({
      success: true,
      persona: persona.toJSON()
    });

  } catch (error) {
    logger.error('Update Rental Route Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
