// backend/src/routes/persona.js
import express from 'express';
import { auth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import Persona from '../models/Persona.js';
import AWSBedrockService from '../services/aws-bedrock-service.js';
import AWSImageService from '../services/aws-image-service.js';
import EvolutionService from '../services/evolutionService.js';

const router = express.Router();

// Get all personas
router.get('/', rateLimit, async (req, res) => {
  try {
    const { category, featured, limit = 20, offset = 0 } = req.query;
    
    const personas = await Persona.findByFilters({
      category,
      featured: featured === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: personas,
      pagination: {
        total: personas.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personas',
      message: error.message
    });
  }
});

// Get featured personas
router.get('/featured', rateLimit, async (req, res) => {
  try {
    const personas = await Persona.findFeatured();
    
    res.json({
      success: true,
      data: personas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured personas'
    });
  }
});

// Get single persona
router.get('/:id', rateLimit, async (req, res) => {
  try {
    const persona = await Persona.findById(req.params.id);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    res.json({
      success: true,
      data: persona
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch persona'
    });
  }
});

// Create new persona
router.post('/', auth, rateLimit, async (req, res) => {
  try {
    const personaData = {
      ...req.body,
      creatorWallet: req.walletAddress
    };

    // Generate AI avatar if requested
    if (personaData.generateAvatar) {
      const avatarResult = await AWSImageService.generatePersonaAvatar(personaData);
      personaData.avatarUrl = avatarResult.imageUrl;
      personaData.imageMetadata = avatarResult.metadata;
    }

    const persona = await Persona.create(personaData);

    res.status(201).json({
      success: true,
      data: persona,
      message: 'Persona created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create persona',
      message: error.message
    });
  }
});

// Update persona
router.put('/:id', auth, rateLimit, async (req, res) => {
  try {
    const persona = await Persona.findById(req.params.id);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    // Verify ownership
    if (persona.creatorWallet !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this persona'
      });
    }

    const updatedPersona = await Persona.update(req.params.id, req.body);

    res.json({
      success: true,
      data: updatedPersona,
      message: 'Persona updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update persona'
    });
  }
});

// Get persona evolution report
router.get('/:id/evolution', rateLimit, async (req, res) => {
  try {
    const persona = await Persona.findById(req.params.id);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    const battleResults = await Persona.getBattleResults(req.params.id);
    const evolutionReport = EvolutionService.generateEvolutionReport(persona, battleResults);

    res.json({
      success: true,
      data: evolutionReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate evolution report'
    });
  }
});

// Check NFT eligibility
router.get('/:id/nft-eligibility', auth, rateLimit, async (req, res) => {
  try {
    const persona = await Persona.findById(req.params.id);
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        error: 'Persona not found'
      });
    }

    if (persona.creatorWallet !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const battleStats = await Persona.getBattleStats(req.params.id);
    const eligibility = EvolutionService.shouldEvolveToNFT(persona, battleStats);

    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check NFT eligibility'
    });
  }
});

export default router;
