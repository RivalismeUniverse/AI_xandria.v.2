const express = require('express');
const router = express.Router();
const { Persona, MarketplaceListing, User } = require('../models');
const s3Service = require('../services/s3-service');
const blockchainService = require('../services/blockchainService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { ValidationError, ForbiddenError } = require('../utils/errorHandler');

/**
 * POST /api/nft/mint
 * Mint persona as NFT
 */
router.post('/mint', auth, async (req, res, next) => {
  try {
    const { persona_id } = req.body;

    if (!persona_id) {
      throw new ValidationError('persona_id required');
    }

    const persona = await Persona.findByPk(persona_id);

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // Verify ownership
    if (persona.creator_id !== req.user.id) {
      throw new ForbiddenError('You can only mint your own personas');
    }

    // Check if already minted
    if (persona.is_minted) {
      return res.status(400).json({ error: 'Persona already minted' });
    }

    // Prepare metadata
    const metadata = {
      name: persona.name,
      description: persona.description,
      image: persona.avatar_url,
      attributes: [
        { trait_type: 'Intelligence', value: persona.intelligence },
        { trait_type: 'Creativity', value: persona.creativity },
        { trait_type: 'Persuasiveness', value: persona.persuasiveness },
        { trait_type: 'ELO Rating', value: persona.elo_rating },
        { trait_type: 'Total Battles', value: persona.total_battles },
        { trait_type: 'Total Wins', value: persona.total_wins },
        { trait_type: 'Win Rate', value: persona.total_battles > 0 
          ? ((persona.total_wins / persona.total_battles) * 100).toFixed(1) 
          : 0 
        }
      ],
      properties: {
        personality: persona.personality,
        expertise: persona.expertise,
        created_at: persona.created_at
      }
    };

    // Upload metadata to S3
    const metadataURI = await s3Service.uploadMetadata(persona.id, metadata);

    // Mint NFT on blockchain
    const { tokenId, txHash, contractAddress } = await blockchainService.mintPersonaNFT(
      req.walletAddress,
      persona.id,
      metadataURI,
      metadata
    );

    // Update persona
    await persona.update({
      is_minted: true,
      nft_token_id: tokenId,
      nft_contract_address: contractAddress
    });

    logger.info('Persona minted as NFT', {
      personaId: persona.id,
      tokenId,
      txHash,
      owner: req.walletAddress
    });

    res.status(201).json({
      message: 'Persona minted successfully',
      token_id: tokenId,
      tx_hash: txHash,
      contract_address: contractAddress,
      metadata_uri: metadataURI
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/nft/marketplace
 * Get marketplace listings
 */
router.get('/marketplace', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sort = 'created_at',
      order = 'DESC',
      min_price,
      max_price
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { is_active: true };

    // Price filtering
    if (min_price) {
      where.price = { ...where.price, [Op.gte]: min_price };
    }
    if (max_price) {
      where.price = { ...where.price, [Op.lte]: max_price };
    }

    const listings = await MarketplaceListing.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort, order]],
      include: [
        {
          model: Persona,
          as: 'persona',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'wallet_address']
          }]
        },
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'username', 'wallet_address']
        }
      ]
    });

    res.json({
      listings: listings.rows,
      total: listings.count,
      page: parseInt(page),
      totalPages: Math.ceil(listings.count / limit)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/nft/marketplace
 * Create marketplace listing
 */
router.post('/marketplace', auth, async (req, res, next) => {
  try {
    const { persona_id, price } = req.body;

    if (!persona_id || !price) {
      throw new ValidationError('persona_id and price required');
    }

    if (price <= 0) {
      throw new ValidationError('Price must be greater than 0');
    }

    const persona = await Persona.findByPk(persona_id);

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    if (!persona.is_minted) {
      return res.status(400).json({ 
        error: 'Persona must be minted as NFT first' 
      });
    }

    // Verify ownership via blockchain
    const isOwner = await blockchainService.verifyNFTOwnership(
      persona.nft_token_id,
      req.walletAddress
    );

    if (!isOwner) {
      throw new ForbiddenError('You do not own this NFT');
    }

    // Check for existing active listing
    const existingListing = await MarketplaceListing.findOne({
      where: {
        persona_id,
        is_active: true
      }
    });

    if (existingListing) {
      return res.status(400).json({ 
        error: 'Persona already listed' 
      });
    }

    // Create listing
    const listing = await MarketplaceListing.create({
      persona_id,
      seller_id: req.user.id,
      price,
      currency: 'STT'
    });

    logger.info('Marketplace listing created', {
      listingId: listing.id,
      personaId: persona_id,
      price,
      seller: req.walletAddress
    });

    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/nft/marketplace/:id/buy
 * Buy NFT from marketplace
 */
router.post('/marketplace/:id/buy', auth, async (req, res, next) => {
  try {
    const { payment_tx_hash } = req.body;

    if (!payment_tx_hash) {
      throw new ValidationError('payment_tx_hash required');
    }

    const listing = await MarketplaceListing.findByPk(req.params.id, {
      include: [{
        model: Persona,
        as: 'persona',
        include: [{
          model: User,
          as: 'creator'
        }]
      }]
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!listing.is_active) {
      return res.status(400).json({ error: 'Listing not active' });
    }

    if (listing.seller_id === req.user.id) {
      return res.status(400).json({ 
        error: 'Cannot buy your own listing' 
      });
    }

    // TODO: Verify payment transaction on blockchain
    // For now, trust the tx_hash

    // Execute NFT transfer on blockchain
    await blockchainService.transferNFT(
      listing.persona.nft_token_id,
      req.walletAddress,
      payment_tx_hash
    );

    // Update listing
    await listing.update({
      is_active: false,
      sold_at: new Date(),
      buyer_id: req.user.id
    });

    // Calculate fees (7.5% royalty to creator, 2% platform fee)
    const price = parseFloat(listing.price);
    const royalty = price * 0.075;
    const platformFee = price * 0.02;
    const sellerAmount = price - royalty - platformFee;

    // Update revenues
    await User.increment('total_revenue', {
      by: royalty,
      where: { id: listing.persona.creator_id }
    });

    logger.info('NFT sold on marketplace', {
      listingId: listing.id,
      personaId: listing.persona_id,
      price,
      buyer: req.walletAddress,
      seller: listing.seller.wallet_address
    });

    res.json({
      message: 'NFT purchased successfully',
      tx_hash: payment_tx_hash,
      breakdown: {
        total: price,
        royalty,
        platform_fee: platformFee,
        seller_amount: sellerAmount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/nft/marketplace/:id
 * Cancel marketplace listing
 */
router.delete('/marketplace/:id', auth, async (req, res, next) => {
  try {
    const listing = await MarketplaceListing.findByPk(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.seller_id !== req.user.id) {
      throw new ForbiddenError('You can only cancel your own listings');
    }

    if (!listing.is_active) {
      return res.status(400).json({ error: 'Listing already inactive' });
    }

    await listing.update({ is_active: false });

    logger.info('Marketplace listing cancelled', {
      listingId: listing.id,
      personaId: listing.persona_id
    });

    res.json({ message: 'Listing cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
