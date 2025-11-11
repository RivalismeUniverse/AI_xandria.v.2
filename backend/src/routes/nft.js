// backend/src/routes/nft.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import NFT from '../models/NFT.js';
import Persona from '../models/Persona.js';
import BlockchainService from '../services/blockchainService.js';
import S3Service from '../services/s3-service.js';

const router = express.Router();

// Mint persona as NFT
router.post('/mint', auth, rateLimit, async (req, res) => {
  try {
    const { personaId, price = '0.1' } = req.body;

    if (!personaId) {
      return res.status(400).json({
        success: false,
        error: 'personaId is required'
      });
    }

    const persona = await Persona.findById(personaId);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    if (persona.creatorWallet !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mint this persona'
      });
    }

    // Check if already minted
    if (persona.nftTokenId) {
      return res.status(400).json({
        success: false,
        error: 'Persona already minted as NFT'
      });
    }

    // Prepare NFT metadata
    const metadata = {
      name: persona.name,
      description: persona.description,
      image: persona.avatarUrl,
      attributes: [
        {
          trait_type: 'Intelligence',
          value: persona.traits.intelligence
        },
        {
          trait_type: 'Creativity', 
          value: persona.traits.creativity
        },
        {
          trait_type: 'Persuasiveness',
          value: persona.traits.persuasiveness
        },
        {
          trait_type: 'Category',
          value: persona.category
        }
      ],
      external_url: `https://aixandria.com/personas/${persona.id}`,
      background_color: '000000'
    };

    // Upload metadata to S3
    const metadataURI = await S3Service.uploadNFTMetadata(metadata, persona.id);

    // Mint NFT on blockchain
    const mintResult = await BlockchainService.mintPersonaNFT(
      req.walletAddress,
      persona.name,
      metadataURI
    );

    // Update persona with NFT info
    await Persona.update(personaId, {
      nftTokenId: mintResult.tokenId,
      nftMetadataURI: metadataURI,
      isNft: true,
      nftPrice: price
    });

    // Create NFT record
    const nft = await NFT.create({
      tokenId: mintResult.tokenId,
      personaId: persona.id,
      ownerWallet: req.walletAddress,
      creatorWallet: persona.creatorWallet,
      metadataURI,
      price,
      transactionHash: mintResult.transactionHash
    });

    res.status(201).json({
      success: true,
      data: {
        nft,
        transaction: mintResult
      },
      message: 'Persona minted as NFT successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mint NFT',
      message: error.message
    });
  }
});

// List NFT on marketplace
router.post('/:tokenId/list', auth, rateLimit, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { price } = req.body;

    if (!price) {
      return res.status(400).json({
        success: false,
        error: 'Price is required'
      });
    }

    const nft = await NFT.findByTokenId(tokenId);
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }

    if (nft.ownerWallet !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to list this NFT'
      });
    }

    // List on blockchain marketplace
    const listingResult = await BlockchainService.listNFTOnMarketplace(
      tokenId,
      price,
      req.walletAddress
    );

    // Update NFT listing status
    await NFT.updateListing(tokenId, {
      isListed: true,
      listingPrice: price,
      listingId: listingResult.listingId
    });

    res.json({
      success: true,
      data: listingResult,
      message: 'NFT listed on marketplace successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list NFT'
    });
  }
});

// Buy NFT
router.post('/:tokenId/buy', auth, rateLimit, async (req, res) => {
  try {
    const { tokenId } = req.params;

    const nft = await NFT.findByTokenId(tokenId);
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }

    if (!nft.isListed) {
      return res.status(400).json({
        success: false,
        error: 'NFT is not listed for sale'
      });
    }

    if (nft.ownerWallet === req.walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Cannot buy your own NFT'
      });
    }

    // In production, this would handle actual payment
    // For demo, simulate purchase
    await NFT.transferOwnership(tokenId, req.walletAddress);

    res.json({
      success: true,
      data: {
        tokenId,
        newOwner: req.walletAddress,
        price: nft.listingPrice
      },
      message: 'NFT purchased successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to buy NFT'
    });
  }
});

// Get NFT details
router.get('/:tokenId', rateLimit, async (req, res) => {
  try {
    const { tokenId } = req.params;

    const nft = await NFT.findByTokenId(tokenId);
    
    if (!nft) {
      return res.status(404).json({
        success: false,
        error: 'NFT not found'
      });
    }

    const persona = await Persona.findByTokenId(tokenId);

    res.json({
      success: true,
      data: {
        nft,
        persona
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT details'
    });
  }
});

// Get marketplace listings
router.get('/marketplace/listings', rateLimit, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const listings = await NFT.findListings(parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace listings'
    });
  }
});

export default router;
