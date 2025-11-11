// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PersonaNFT.sol";

/**
 * @title PersonaMarketplace
 * @dev Marketplace for trading AI Persona NFTs
 */
contract PersonaMarketplace is ReentrancyGuard, Ownable {
    PersonaNFT public personaNFT;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    // Mapping from listing ID to Listing
    mapping(uint256 => Listing) public listings;

    // Mapping from token ID to listing ID (0 if not listed)
    mapping(uint256 => uint256) public tokenToListingId;

    // Listing counter
    uint256 private _listingIdCounter;

    // Platform fee (1% = 100)
    uint256 public platformFee = 100; // 1%
    address public feeRecipient;

    // Events
    event PersonaListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event PersonaPurchased(
        uint256 indexed listingId,
        address buyer,
        uint256 price
    );

    event ListingCancelled(
        uint256 indexed listingId,
        uint256 indexed tokenId
    );

    event PlatformFeeUpdated(
        uint256 newFee
    );

    /**
     * @dev Constructor
     * @param _personaNFT Address of PersonaNFT contract
     * @param _feeRecipient Address to receive platform fees
     */
    constructor(address _personaNFT, address _feeRecipient) {
        require(_personaNFT != address(0), "Invalid NFT contract address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        personaNFT = PersonaNFT(_personaNFT);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List a persona NFT for sale
     * @param tokenId NFT token ID to list
     * @param price Sale price in STT tokens
     */
    function listPersona(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");
        require(personaNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(tokenToListingId[tokenId] == 0, "Persona already listed");

        // Transfer NFT to marketplace (escrow)
        personaNFT.transferFrom(msg.sender, address(this), tokenId);

        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;

        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        tokenToListingId[tokenId] = listingId;

        emit PersonaListed(listingId, tokenId, msg.sender, price);
    }

    /**
     * @dev Purchase a listed persona NFT
     * @param listingId Listing ID to purchase
     */
    function purchasePersona(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");

        // Calculate fees
        uint256 feeAmount = (msg.value * platformFee) / 10000;
        uint256 sellerAmount = msg.value - feeAmount;

        // Mark listing as inactive
        listing.active = false;
        tokenToListingId[listing.tokenId] = 0;

        // Transfer NFT to buyer
        personaNFT.transferFrom(address(this), msg.sender, listing.tokenId);

        // Transfer funds
        (bool successFee, ) = feeRecipient.call{value: feeAmount}("");
        (bool successSeller, ) = listing.seller.call{value: sellerAmount}("");
        
        require(successFee && successSeller, "Transfer failed");

        emit PersonaPurchased(listingId, msg.sender, msg.value);
    }

    /**
     * @dev Cancel a listing
     * @param listingId Listing ID to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not listing seller");

        listing.active = false;
        tokenToListingId[listing.tokenId] = 0;

        // Return NFT to seller
        personaNFT.transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCancelled(listingId, listing.tokenId);
    }

    /**
     * @dev Get active listings
     */
    function getActiveListings() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 1; i <= _listingIdCounter; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }

        // Create array of active listing IDs
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 counter = 0;
        
        for (uint256 i = 1; i <= _listingIdCounter; i++) {
            if (listings[i].active) {
                activeListings[counter] = i;
                counter++;
            }
        }

        return activeListings;
    }

    /**
     * @dev Get listing details
     * @param listingId Listing ID
     */
    function getListing(uint256 listingId) 
        external 
        view 
        returns (
            uint256 tokenId,
            address seller,
            uint256 price,
            bool active,
            uint256 listedAt
        ) 
    {
        Listing memory listing = listings[listingId];
        return (
            listing.tokenId,
            listing.seller,
            listing.price,
            listing.active,
            listing.listedAt
        );
    }

    /**
     * @dev Update platform fee (only owner)
     * @param newFee New platform fee (1% = 100)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /**
     * @dev Update fee recipient (only owner)
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }

    /**
     * @dev Withdraw accidentally sent tokens (only owner)
     */
    function withdrawStuckTokens(address tokenAddress) external onlyOwner {
        // This function is for emergency withdrawal of stuck ERC20 tokens
        // Not needed for ETH since we handle it in purchases
    }
}
