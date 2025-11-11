// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PersonaNFT.sol";

/**
 * @title ChatPayment
 * @dev Handle payments for chatting with AI Personas
 */
contract ChatPayment is ReentrancyGuard, Ownable {
    PersonaNFT public personaNFT;

    // Platform fee (20% = 2000)
    uint256 public platformFee = 2000; // 20%
    
    // Creator share (80% = 8000) 
    uint256 public creatorShare = 8000; // 80%

    address public feeRecipient;

    // Track chat unlocks
    struct ChatUnlock {
        address user;
        uint256 personaId;
        uint256 amountPaid;
        uint256 unlockedAt;
        bool used;
    }

    mapping(bytes32 => ChatUnlock) public chatUnlocks;
    mapping(address => uint256) public creatorEarnings;

    // Events
    event ChatUnlocked(
        bytes32 indexed unlockId,
        address indexed user,
        uint256 indexed personaId,
        uint256 amount,
        address creator
    );

    event EarningsWithdrawn(
        address indexed creator,
        uint256 amount
    );

    event FeesUpdated(
        uint256 newPlatformFee,
        uint256 newCreatorShare
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
     * @dev Pay to unlock chat with a persona
     * @param personaId Persona NFT ID
     */
    function unlockChat(uint256 personaId) external payable nonReentrant {
        require(personaNFT.ownerOf(personaId) != address(0), "Persona does not exist");
        
        // Get chat price from NFT contract
        (,,,,,,uint256 chatPrice,,) = personaNFT.getPersonaData(personaId);
        require(msg.value == chatPrice, "Incorrect payment amount");

        // Calculate distribution
        uint256 feeAmount = (msg.value * platformFee) / 10000;
        uint256 creatorAmount = msg.value - feeAmount;

        // Get persona creator
        (,,,,,,,,address creator,) = personaNFT.getPersonaData(personaId);

        // Record unlock
        bytes32 unlockId = keccak256(abi.encodePacked(msg.sender, personaId, block.timestamp));
        
        chatUnlocks[unlockId] = ChatUnlock({
            user: msg.sender,
            personaId: personaId,
            amountPaid: msg.value,
            unlockedAt: block.timestamp,
            used: false
        });

        // Transfer funds
        (bool successFee, ) = feeRecipient.call{value: feeAmount}("");
        require(successFee, "Fee transfer failed");

        // Track creator earnings (they can withdraw later)
        creatorEarnings[creator] += creatorAmount;

        emit ChatUnlocked(unlockId, msg.sender, personaId, msg.value, creator);
    }

    /**
     * @dev Verify chat unlock
     * @param unlockId Unlock ID to verify
     * @param user User address to verify
     * @param personaId Persona ID to verify
     */
    function verifyChatUnlock(
        bytes32 unlockId,
        address user,
        uint256 personaId
    ) external view returns (bool) {
        ChatUnlock memory unlock = chatUnlocks[unlockId];
        
        return (
            unlock.user == user &&
            unlock.personaId == personaId &&
            !unlock.used &&
            block.timestamp <= unlock.unlockedAt + 24 hours // 24-hour access
        );
    }

    /**
     * @dev Mark chat unlock as used
     * @param unlockId Unlock ID to mark as used
     */
    function markUnlockUsed(bytes32 unlockId) external {
        require(chatUnlocks[unlockId].user != address(0), "Unlock not found");
        require(!chatUnlocks[unlockId].used, "Unlock already used");
        
        chatUnlocks[unlockId].used = true;
    }

    /**
     * @dev Withdraw creator earnings
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");

        creatorEarnings[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit EarningsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Get creator earnings
     * @param creator Creator address
     */
    function getCreatorEarnings(address creator) external view returns (uint256) {
        return creatorEarnings[creator];
    }

    /**
     * @dev Update fee distribution (only owner)
     * @param newPlatformFee New platform fee percentage
     * @param newCreatorShare New creator share percentage
     */
    function updateFees(uint256 newPlatformFee, uint256 newCreatorShare) external onlyOwner {
        require(newPlatformFee + newCreatorShare == 10000, "Fees must sum to 100%");
        require(newPlatformFee <= 5000, "Platform fee too high"); // Max 50%
        
        platformFee = newPlatformFee;
        creatorShare = newCreatorShare;

        emit FeesUpdated(newPlatformFee, newCreatorShare);
    }

    /**
     * @dev Update fee recipient (only owner)
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
}
