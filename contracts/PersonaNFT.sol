// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PersonaNFT
 * @dev ERC-721 NFT for AI Personas with on-chain metadata and battle stats
 */
contract PersonaNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;

    // Persona struct to store AI persona data
    struct PersonaData {
        string name;
        string category;
        string specialization;
        uint256 battleWins;
        uint256 battleLosses;
        uint256 rating;
        uint256 chatPrice;
        address creator;
        uint256 createdAt;
    }

    // Mapping from token ID to persona data
    mapping(uint256 => PersonaData) public personaData;

    // Mapping from token ID to current owner
    mapping(uint256 => address) public tokenOwners;

    // Events
    event PersonaMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        string tokenURI
    );
    
    event PersonaStatsUpdated(
        uint256 indexed tokenId,
        uint256 battleWins,
        uint256 battleLosses,
        uint256 rating
    );

    event ChatPriceUpdated(
        uint256 indexed tokenId,
        uint256 newPrice
    );

    constructor() ERC721("AI Persona", "AIP") {}

    /**
     * @dev Mint a new AI Persona NFT
     * @param to Address to mint the NFT to
     * @param tokenURI IPFS/metadata URI
     * @param name Persona name
     * @param category Persona category
     * @param specialization Persona specialization
     */
    function mintPersona(
        address to,
        string memory tokenURI,
        string memory name,
        string memory category,
        string memory specialization
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Initialize persona data
        personaData[tokenId] = PersonaData({
            name: name,
            category: category,
            specialization: specialization,
            battleWins: 0,
            battleLosses: 0,
            rating: 1000, // Starting Elo rating
            chatPrice: 5 ether, // Default 5 STT tokens
            creator: msg.sender,
            createdAt: block.timestamp
        });

        tokenOwners[tokenId] = to;

        emit PersonaMinted(tokenId, to, name, tokenURI);
        return tokenId;
    }

    /**
     * @dev Update persona battle stats (only callable by BattleArena contract)
     * @param tokenId NFT token ID
     * @param wonBattle Whether the persona won the battle
     * @param ratingChange Elo rating change
     */
    function updateBattleStats(
        uint256 tokenId,
        bool wonBattle,
        int256 ratingChange
    ) external {
        require(_exists(tokenId), "Persona does not exist");
        // In production, restrict to BattleArena contract only
        // require(msg.sender == battleArenaAddress, "Not authorized");

        PersonaData storage persona = personaData[tokenId];
        
        if (wonBattle) {
            persona.battleWins += 1;
        } else {
            persona.battleLosses += 1;
        }

        // Update rating (ensure it doesn't go below 0)
        if (ratingChange > 0) {
            persona.rating += uint256(ratingChange);
        } else if (ratingChange < 0 && persona.rating > uint256(-ratingChange)) {
            persona.rating -= uint256(-ratingChange);
        }

        emit PersonaStatsUpdated(
            tokenId,
            persona.battleWins,
            persona.battleLosses,
            persona.rating
        );
    }

    /**
     * @dev Set chat price for persona (only owner)
     * @param tokenId NFT token ID
     * @param newPrice New chat price in STT tokens
     */
    function setChatPrice(uint256 tokenId, uint256 newPrice) external {
        require(_exists(tokenId), "Persona does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(newPrice > 0, "Price must be greater than 0");

        personaData[tokenId].chatPrice = newPrice;
        emit ChatPriceUpdated(tokenId, newPrice);
    }

    /**
     * @dev Get persona data by token ID
     * @param tokenId NFT token ID
     */
    function getPersonaData(uint256 tokenId) 
        external 
        view 
        returns (
            string memory name,
            string memory category,
            string memory specialization,
            uint256 battleWins,
            uint256 battleLosses,
            uint256 rating,
            uint256 chatPrice,
            address creator,
            uint256 createdAt
        ) 
    {
        require(_exists(tokenId), "Persona does not exist");
        
        PersonaData memory persona = personaData[tokenId];
        return (
            persona.name,
            persona.category,
            persona.specialization,
            persona.battleWins,
            persona.battleLosses,
            persona.rating,
            persona.chatPrice,
            persona.creator,
            persona.createdAt
        );
    }

    /**
     * @dev Get all token IDs owned by an address
     * @param owner Address to query
     */
    function getTokensByOwner(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 counter = 0;

        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokens[counter] = i;
                counter++;
                if (counter == balance) break;
            }
        }

        return tokens;
    }

    /**
     * @dev Override transfer to update tokenOwners mapping
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        super._transfer(from, to, tokenId);
        tokenOwners[tokenId] = to;
    }

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Override required by Solidity
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
