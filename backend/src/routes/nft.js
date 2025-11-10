// backend/src/routes/nft.js
// NFT marketplace endpoints for AI_XANDRIA v2.0
// Handles minting, listing, and trading persona NFTs

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../config/database');
const blockchainService = require('../services/blockchainService');
const ipfsService = require('../services/ipfsService');

/**
 * POST /api/nft/mint
 * Mint a persona as NFT
 * @authenticated
 */
router.post(
  '/mint',
  auth,
  [
    body('persona_id').isUUID().withMessage('Invalid persona ID'),
    body('mint_price').optional().isFloat({ min: 0 }).withMessage('Invalid mint price')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { persona_id, mint_price = 0 } = req.body;
      const user_address = req.user.wallet_address;

      // Check if persona exists and belongs to user
      const personaResult = await db.query(
        'SELECT * FROM personas WHERE id = $1 AND owner_address = $2',
        [persona_id, user_address]
      );

      if (personaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Persona not found or not owned by you' });
      }

      const persona = personaResult.rows[0];

      if (persona.is_minted) {
        return res.status(400).json({ error: 'Persona already minted as NFT' });
      }

      // Prepare metadata
      const metadata = {
        name: persona.name,
        description: `${persona.name} - An autonomous AI persona from AI_XANDRIA`,
        type: persona.type,
        personality: persona.personality,
        image: `https://api.dicebear.com/7.x/bottts/svg?seed=${persona.id}`, // Generated avatar
        attributes: [
          {
            trait_type: "Rating",
            value: persona.rating
          },
          {
            trait_type: "Total Battles",
            value: persona.total_battles
          },
          {
            trait_type: "Battle Wins",
            value: persona.battle_wins
          },
          {
            trait_type: "Total Chats",
            value: persona.total_chats
          },
          ...Object.entries(persona.personality.traits || {}).map(([key, value]) => ({
            trait_type: key.charAt(0).toUpperCase() + key.slice(1),
            value: value
          }))
        ],
        created_at: persona.created_at,
        external_url: `https://aixandria.io/persona/${persona.id}`
      };

      // Upload metadata to IPFS
      const metadataURI = await ipfsService.uploadJSON(metadata);

      // Mint NFT on blockchain
      const mintResult = await blockchainService.mintPersonaNFT(
        user_address,
        metadataURI,
        mint_price
      );

      // Update persona in database
      await db.query(
        `UPDATE personas 
         SET is_minted = true, token_id = $1, contract_address = $2, metadata_uri = $3
         WHERE id = $4`,
        [mintResult.tokenId, mintResult.contractAddress, metadataURI, persona_id]
      );

      logger.info(`Persona ${persona_id} minted as NFT #${mintResult.tokenId}`);

      res.json({
        success: true,
        message: 'Persona minted successfully',
        nft: {
          token_id: mintResult.tokenId,
          contract_address: mintResult.contractAddress,
          metadata_uri: metadataURI,
          tx_hash: mintResult.txHash
        }
      });
    } catch (error) {
      logger.error('Error minting NFT:', error);
      res.status(500).json({ error: 'Failed to mint NFT', details: error.message });
    }
  }
);

/**
 * GET /api/nft/marketplace
 * List NFTs available for sale
 */
router.get('/marketplace', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'recent', type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.name, p.type, p.personality, p.rating,
        p.total_battles, p.battle_wins, p.total_chats,
        p.token_id, p.contract_address, p.metadata_uri, p.owner_address,
        m.price, m.listed_at, m.is_active
      FROM personas p
      INNER JOIN marketplace_listings m ON p.id = m.persona_id
      WHERE p.is_minted = true AND m.is_active = true
    `;

    const params = [];
    if (type) {
      query += ` AND p.type = $${params.length + 1}`;
      params.push(type);
    }

    // Sorting
    switch (sort) {
      case 'price_low':
        query += ' ORDER BY m.price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY m.price DESC';
        break;
      case 'rating':
        query += ' ORDER BY p.rating DESC';
        break;
      default:
        query += ' ORDER BY m.listed_at DESC';
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      listings: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      }
    });
  } catch (error) {
    logger.error('Error fetching marketplace:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace listings' });
  }
});

/**
 * POST /api/nft/:tokenId/list
 * List NFT for sale
 * @authenticated
 */
router.post(
  '/:tokenId/list',
  auth,
  [
    param('tokenId').isInt({ min: 0 }).withMessage('Invalid token ID'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tokenId } = req.params;
      const { price } = req.body;
      const user_address = req.user.wallet_address;

      // Check ownership
      const personaResult = await db.query(
        'SELECT id FROM personas WHERE token_id = $1 AND owner_address = $2',
        [tokenId, user_address]
      );

      if (personaResult.rows.length === 0) {
        return res.status(403).json({ error: 'You do not own this NFT' });
      }

      const persona_id = personaResult.rows[0].id;

      // Check if already listed
      const existingListing = await db.query(
        'SELECT id FROM marketplace_listings WHERE persona_id = $1 AND is_active = true',
        [persona_id]
      );

      if (existingListing.rows.length > 0) {
        return res.status(400).json({ error: 'NFT already listed for sale' });
      }

      // Create listing on blockchain
      const listingResult = await blockchainService.listNFTForSale(tokenId, price, user_address);

      // Save listing to database
      await db.query(
        `INSERT INTO marketplace_listings (persona_id, seller_address, price, is_active, listed_at)
         VALUES ($1, $2, $3, true, NOW())`,
        [persona_id, user_address, price]
      );

      logger.info(`NFT #${tokenId} listed for ${price} STT by ${user_address}`);

      res.json({
        success: true,
        message: 'NFT listed successfully',
        listing: {
          token_id: tokenId,
          price,
          tx_hash: listingResult.txHash
        }
      });
    } catch (error) {
      logger.error('Error listing NFT:', error);
      res.status(500).json({ error: 'Failed to list NFT' });
    }
  }
);

/**
 * POST /api/nft/:tokenId/buy
 * Purchase an NFT
 * @authenticated
 */
router.post(
  '/:tokenId/buy',
  auth,
  [
    param('tokenId').isInt({ min: 0 }).withMessage('Invalid token ID'),
    body('tx_hash').isString().withMessage('Transaction hash required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tokenId } = req.params;
      const { tx_hash } = req.body;
      const buyer_address = req.user.wallet_address;

      // Get listing details
      const listingResult = await db.query(
        `SELECT m.*, p.id as persona_id, p.owner_address
         FROM marketplace_listings m
         INNER JOIN personas p ON m.persona_id = p.id
         WHERE p.token_id = $1 AND m.is_active = true`,
        [tokenId]
      );

      if (listingResult.rows.length === 0) {
        return res.status(404).json({ error: 'NFT not listed for sale' });
      }

      const listing = listingResult.rows[0];

      if (listing.owner_address === buyer_address) {
        return res.status(400).json({ error: 'Cannot buy your own NFT' });
      }

      // Verify transaction
      const txVerification = await blockchainService.verifyNFTPurchase(
        tx_hash,
        tokenId,
        listing.price,
        buyer_address
      );

      if (!txVerification.valid) {
        return res.status(400).json({ 
          error: 'Invalid transaction',
          details: txVerification.error
        });
      }

      // Transfer ownership
      await db.query(
        'UPDATE personas SET owner_address = $1 WHERE token_id = $2',
        [buyer_address, tokenId]
      );

      // Deactivate listing
      await db.query(
        'UPDATE marketplace_listings SET is_active = false WHERE persona_id = $1',
        [listing.persona_id]
      );

      // Record sale
      await db.query(
        `INSERT INTO nft_sales (
          persona_id, token_id, seller_address, buyer_address, price, tx_hash, sold_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [listing.persona_id, tokenId, listing.owner_address, buyer_address, listing.price, tx_hash]
      );

      // Process royalties (10% to original creator, 5% to platform)
      await blockchainService.distributeRoyalties(
        listing.price,
        listing.seller_address,
        buyer_address,
        tokenId
      );

      logger.info(`NFT #${tokenId} sold to ${buyer_address} for ${listing.price} STT`);

      res.json({
        success: true,
        message: 'NFT purchased successfully',
        sale: {
          token_id: tokenId,
          price: listing.price,
          new_owner: buyer_address,
          tx_hash
        }
      });
    } catch (error) {
      logger.error('Error purchasing NFT:', error);
      res.status(500).json({ error: 'Failed to purchase NFT' });
    }
  }
);

/**
 * DELETE /api/nft/:tokenId/unlist
 * Remove NFT from marketplace
 * @authenticated
 */
router.delete(
  '/:tokenId/unlist',
  auth,
  param('tokenId').isInt({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tokenId } = req.params;
      const user_address = req.user.wallet_address;

      // Verify ownership
      const personaResult = await db.query(
        'SELECT id FROM personas WHERE token_id = $1 AND owner_address = $2',
        [tokenId, user_address]
      );

      if (personaResult.rows.length === 0) {
        return res.status(403).json({ error: 'You do not own this NFT' });
      }

      // Deactivate listing
      const result = await db.query(
        `UPDATE marketplace_listings 
         SET is_active = false 
         WHERE persona_id = $1 AND is_active = true`,
        [personaResult.rows[0].id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'NFT is not listed' });
      }

      logger.info(`NFT #${tokenId} unlisted by ${user_address}`);

      res.json({
        success: true,
        message: 'NFT unlisted successfully'
      });
    } catch (error) {
      logger.error('Error unlisting NFT:', error);
      res.status(500).json({ error: 'Failed to unlist NFT' });
    }
  }
);

/**
 * GET /api/nft/:tokenId
 * Get NFT details
 */
router.get('/:tokenId', param('tokenId').isInt({ min: 0 }), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tokenId } = req.params;

    const result = await db.query(
      `SELECT 
        p.*,
        m.price as listing_price, m.is_active as is_listed,
        (SELECT COUNT(*) FROM nft_sales WHERE token_id = p.token_id) as sale_count,
        (SELECT AVG(price) FROM nft_sales WHERE token_id = p.token_id) as avg_sale_price
       FROM personas p
       LEFT JOIN marketplace_listings m ON p.id = m.persona_id AND m.is_active = true
       WHERE p.token_id = $1 AND p.is_minted = true`,
      [tokenId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json({
      success: true,
      nft: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching NFT details:', error);
    res.status(500).json({ error: 'Failed to fetch NFT details' });
  }
});

/**
 * GET /api/nft/user/:address
 * Get NFTs owned by a user
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const result = await db.query(
      `SELECT 
        p.id, p.name, p.type, p.personality, p.rating,
        p.token_id, p.contract_address, p.metadata_uri,
        p.total_battles, p.battle_wins, p.total_chats
       FROM personas p
       WHERE p.owner_address = $1 AND p.is_minted = true
       ORDER BY p.created_at DESC`,
      [address]
    );

    res.json({
      success: true,
      nfts: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching user NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch user NFTs' });
  }
});

module.exports = router;
