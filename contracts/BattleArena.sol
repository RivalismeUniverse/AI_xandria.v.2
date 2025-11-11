// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PersonaNFT.sol";

/**
 * @title BattleArena
 * @dev On-chain battle system for AI Personas with voting and rewards
 */
contract BattleArena is Ownable, ReentrancyGuard {
    PersonaNFT public personaNFT;

    struct Battle {
        uint256 persona1Id;
        uint256 persona2Id;
        string topic;
        uint256 votes1;
        uint256 votes2;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 winner;
        address creator;
    }

    struct Vote {
        address voter;
        uint256 votedFor; // persona1Id or persona2Id
        uint256 timestamp;
    }

    // Mapping from battle ID to Battle
    mapping(uint256 => Battle) public battles;

    // Mapping from battle ID to votes
    mapping(uint256 => Vote[]) public battleVotes;

    // Mapping to track if address has voted in a battle
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Battle counter
    uint256 private _battleIdCounter;

    // Battle duration (24 hours)
    uint256 public battleDuration = 24 hours;

    // Minimum vote threshold to complete battle
    uint256 public minVoteThreshold = 10;

    // Elo rating constants
    uint256 public constant K_FACTOR = 32;
    uint256 public constant INITIAL_RATING = 1000;

    // Events
    event BattleCreated(
        uint256 indexed battleId,
        uint256 persona1Id,
        uint256 persona2Id,
        string topic,
        address creator
    );

    event VoteCast(
        uint256 indexed battleId,
        address voter,
        uint256 votedFor
    );

    event BattleCompleted(
        uint256 indexed battleId,
        uint256 winnerId,
        uint256 persona1NewRating,
        uint256 persona2NewRating
    );

    /**
     * @dev Constructor
     * @param _personaNFT Address of PersonaNFT contract
     */
    constructor(address _personaNFT) {
        require(_personaNFT != address(0), "Invalid NFT contract address");
        personaNFT = PersonaNFT(_personaNFT);
    }

    /**
     * @dev Create a new battle
     * @param persona1Id First persona NFT ID
     * @param persona2Id Second persona NFT ID
     * @param topic Battle topic
     */
    function createBattle(
        uint256 persona1Id,
        uint256 persona2Id,
        string calldata topic
    ) external returns (uint256) {
        require(persona1Id != persona2Id, "Cannot battle same persona");
        require(personaNFT.ownerOf(persona1Id) != address(0), "Persona 1 does not exist");
        require(personaNFT.ownerOf(persona2Id) != address(0), "Persona 2 does not exist");
        require(bytes(topic).length > 0, "Topic cannot be empty");

        _battleIdCounter++;
        uint256 battleId = _battleIdCounter;

        battles[battleId] = Battle({
            persona1Id: persona1Id,
            persona2Id: persona2Id,
            topic: topic,
            votes1: 0,
            votes2: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + battleDuration,
            active: true,
            winner: 0,
            creator: msg.sender
        });

        emit BattleCreated(battleId, persona1Id, persona2Id, topic, msg.sender);
        return battleId;
    }

    /**
     * @dev Vote in a battle
     * @param battleId Battle ID
     * @param votedForPersonaId Persona ID to vote for (must be persona1Id or persona2Id)
     */
    function vote(uint256 battleId, uint256 votedForPersonaId) external {
        Battle storage battle = battles[battleId];
        
        require(battle.active, "Battle not active");
        require(block.timestamp < battle.endTime, "Battle ended");
        require(!hasVoted[battleId][msg.sender], "Already voted");
        require(
            votedForPersonaId == battle.persona1Id || votedForPersonaId == battle.persona2Id,
            "Invalid persona for this battle"
        );

        // Record vote
        hasVoted[battleId][msg.sender] = true;
        battleVotes[battleId].push(Vote({
            voter: msg.sender,
            votedFor: votedForPersonaId,
            timestamp: block.timestamp
        }));

        // Update vote counts
        if (votedForPersonaId == battle.persona1Id) {
            battle.votes1++;
        } else {
            battle.votes2++;
        }

        emit VoteCast(battleId, msg.sender, votedForPersonaId);

        // Check if battle should complete
        uint256 totalVotes = battle.votes1 + battle.votes2;
        if (totalVotes >= minVoteThreshold || block.timestamp >= battle.endTime) {
            _completeBattle(battleId);
        }
    }

    /**
     * @dev Complete battle and update ratings
     * @param battleId Battle ID to complete
     */
    function _completeBattle(uint256 battleId) internal {
        Battle storage battle = battles[battleId];
        
        require(battle.active, "Battle already completed");
        require(
            block.timestamp >= battle.endTime || 
            (battle.votes1 + battle.votes2) >= minVoteThreshold,
            "Battle cannot be completed yet"
        );

        battle.active = false;

        uint256 winnerId;
        if (battle.votes1 > battle.votes2) {
            winnerId = battle.persona1Id;
        } else if (battle.votes2 > battle.votes1) {
            winnerId = battle.persona2Id;
        } else {
            // Tie - no winner
            winnerId = 0;
        }

        battle.winner = winnerId;

        // Update persona ratings if there's a winner
        if (winnerId != 0) {
            uint256 loserId = winnerId == battle.persona1Id ? battle.persona2Id : battle.persona1Id;
            
            (int256 winnerRatingChange, int256 loserRatingChange) = calculateRatingChanges(
                battle.persona1Id,
                battle.persona2Id,
                winnerId == battle.persona1Id
            );

            // Update persona stats
            personaNFT.updateBattleStats(winnerId, true, winnerRatingChange);
            personaNFT.updateBattleStats(loserId, false, loserRatingChange);

            emit BattleCompleted(
                battleId,
                winnerId,
                uint256(int256(INITIAL_RATING) + winnerRatingChange),
                uint256(int256(INITIAL_RATING) + loserRatingChange)
            );
        }
    }

    /**
     * @dev Calculate Elo rating changes
     */
    function calculateRatingChanges(
        uint256 persona1Id,
        uint256 persona2Id,
        bool persona1Won
    ) public pure returns (int256 winnerChange, int256 loserChange) {
        // Simplified Elo calculation
        // In production, you'd fetch current ratings from the NFT contract
        uint256 expectedScore1 = 1 * 1e18 / (1 + 1e18); // Simplified
        uint256 actualScore1 = persona1Won ? 1 * 1e18 : 0;

        int256 change = int256((K_FACTOR * (actualScore1 - expectedScore1)) / 1e18);
        
        if (persona1Won) {
            winnerChange = change;
            loserChange = -change;
        } else {
            winnerChange = -change;
            loserChange = change;
        }
    }

    /**
     * @dev Get battle details
     * @param battleId Battle ID
     */
    function getBattle(uint256 battleId)
        external
        view
        returns (
            uint256 persona1Id,
            uint256 persona2Id,
            string memory topic,
            uint256 votes1,
            uint256 votes2,
            uint256 startTime,
            uint256 endTime,
            bool active,
            uint256 winner,
            address creator
        )
    {
        Battle memory battle = battles[battleId];
        return (
            battle.persona1Id,
            battle.persona2Id,
            battle.topic,
            battle.votes1,
            battle.votes2,
            battle.startTime,
            battle.endTime,
            battle.active,
            battle.winner,
            battle.creator
        );
    }

    /**
     * @dev Get votes for a battle
     * @param battleId Battle ID
     */
    function getVotes(uint256 battleId) external view returns (Vote[] memory) {
        return battleVotes[battleId];
    }

    /**
     * @dev Get active battles
     */
    function getActiveBattles() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= _battleIdCounter; i++) {
            if (battles[i].active) {
                activeCount++;
            }
        }

        uint256[] memory activeBattles = new uint256[](activeCount);
        uint256 counter = 0;
        
        for (uint256 i = 1; i <= _battleIdCounter; i++) {
            if (battles[i].active) {
                activeBattles[counter] = i;
                counter++;
            }
        }

        return activeBattles;
    }

    /**
     * @dev Set battle duration (only owner)
     * @param newDuration New duration in seconds
     */
    function setBattleDuration(uint256 newDuration) external onlyOwner {
        require(newDuration >= 1 hours, "Duration too short");
        require(newDuration <= 7 days, "Duration too long");
        battleDuration = newDuration;
    }

    /**
     * @dev Set minimum vote threshold (only owner)
     * @param newThreshold New minimum vote threshold
     */
    function setMinVoteThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold >= 2, "Threshold too low");
        minVoteThreshold = newThreshold;
    }

    /**
     * @dev Force complete a battle (only owner, for emergency)
     * @param battleId Battle ID to complete
     */
    function forceCompleteBattle(uint256 battleId) external onlyOwner {
        _completeBattle(battleId);
    }
}
