const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchainService');
const { Persona } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Get NFT marketplace listings
router.get('/marketplace', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const personas = await Persona.findAll({
      where: { 
        is_rentable: true,
        token_id: { [Op.not]: null }
      },
      order: [['rating', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const listings = personas.map(persona => ({
      id: persona.id,
      tokenId: persona.token_id,
      name: persona.name,
      description: persona.description,
      traits: persona.traits,
      rating: persona.rating,
      rentalPrice: persona.rental_price,
      owner: persona.owner_address,
      battleStats: {
        wins: persona.battle_wins,
        losses: persona.battle_losses
      },
      image: `https://ai-xandria.com/personas/${persona.id}/avatar.png`
    }));

    res.json({
      success: true,
      listings,
      total: listings.length
    });

  } catch (error) {
    logger.error('Marketplace Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get NFT details
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const persona = await Persona.findOne({
      where: { token_id: tokenId }
    });

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }

    const nftDetails = {
      tokenId: persona.token_id,
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
      owner: persona.owner_address,
      contractAddress: persona.contract_address,
      created: persona.created_date,
      external_url: `https://ai-xandria.com/personas/${persona.id}`
    };

    res.json({
      success: true,
      nft: nftDetails
    });

  } catch (error) {
    logger.error('NFT Details Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's NFTs
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const personas = await Persona.findAll({
      where: { 
        owner_address: walletAddress,
        token_id: { [Op.not]: null }
      },
      order: [['created_date', 'DESC']]
    });

    const nfts = personas.map(persona => ({
      tokenId: persona.token_id,
      name: persona.name,
      image: `https://ai-xandria.com/personas/${persona.id}/avatar.png`,
      traits: persona.traits,
      isRentable: persona.is_rentable,
      rentalPrice: persona.rental_price,
      battleStats: {
        wins: persona.battle_wins,
        losses: persona.battle_losses
      }
    }));

    res.json({
      success: true,
      nfts,
      count: nfts.length
    });

  } catch (error) {
    logger.error('User NFTs Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Transfer NFT ownership
router.post('/:tokenId/transfer', auth, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { toAddress } = req.body;
    const walletAddress = req.walletAddress;

    const persona = await Persona.findOne({
      where: { 
        token_id: tokenId,
        owner_address: walletAddress 
      }
    });

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found or not owned by you'
      });
    }

    // In a real implementation, you'd call the blockchain transfer function
    // For hackathon, we'll simulate the transfer
    const transferResult = {
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: walletAddress,
      to: toAddress,
      tokenId: parseInt(tokenId)
    };

    // Update ownership in database
    await persona.update({
      owner_address: toAddress,
      is_rentable: false // Reset rental status on transfer
    });

    logger.info('NFT Transferred', transferResult);

    res.json({
      success: true,
      transfer: transferResult
    });

  } catch (error) {
    logger.error('NFT Transfer Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
