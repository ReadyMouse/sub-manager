// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ========================================
// OPENZEPPELIN IMPORTS
// ========================================

// IERC20: Interface for interacting with PYUSD token
// Provides: transfer(), transferFrom(), balanceOf(), allowance(), approve()
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ReentrancyGuard: Prevents reentrancy attacks
// Critical for processPayment() function which transfers tokens
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Ownable: Provides basic access control (owner-only functions)
// Useful if we need admin functions like pausing or updating parameters
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SubChainSubscription
 * @author SubChain Team
 * @notice A decentralized subscription management protocol for PYUSD recurring payments
 * @dev This contract enables "set and forget" crypto subscriptions using the ERC-20 allowance pattern
 * 
 * KEY FEATURES:
 * - Users approve PYUSD spending once, payments auto-process on billing cycle
 * - No fund locking - money stays in user wallet until payment is due
 * - Handles payment failures gracefully (auto-cancel after 3 consecutive failures)
 * - Direct crypto-to-crypto payments to recipient wallet addresses
 * - Emits events for Envio indexer to track subscription lifecycle
 * 
 * FLOW:
 * 1. User approves SubChain contract to spend PYUSD (one-time)
 * 2. User calls createSubscription() to start subscription
 * 3. Service provider/bot calls processPayment() when billing is due
 * 4. Contract pulls payment from user wallet via transferFrom() and sends to recipient
 * 5. User can cancel anytime via cancelSubscription()
 */
contract SubChainSubscription is ReentrancyGuard, Ownable {
    // ========================================
    // ENUMS & STRUCTS
    // ========================================
    
    /**
     * @notice Core subscription data structure
     * @dev Packed for gas optimization where possible (per TC-2 in PRD)
     * @dev Analytics fields (createdAt, lastPaymentTime) calculated from events via Envio
     * @param id Unique subscription ID (same as mapping key, included for convenience)
     * @param senderAddress User's wallet address who created the subscription
     * @param senderCurrency Sender currency ticker code (e.g., "PYUSD", "BTC", "ETH", "USDC")
     * @param senderId Unique ID referencing sender in off-chain database
     * @param amount Payment amount in PYUSD base units (6 decimals, e.g., 10 PYUSD = 10000000)
     * @param interval Billing interval in seconds (e.g., 30 days = 2592000)
     * @param nextPaymentDue Unix timestamp when next payment is due
     * @param endDate Unix timestamp when subscription ends (0 = no expiration, runs indefinitely)
     * @param maxPayments Maximum number of payments before auto-cancel (0 = unlimited)
     * @param paymentCount Number of successful payments made so far
     * @param isActive Whether subscription is currently active (false = cancelled)
     * @param failedPaymentCount Consecutive failed payment attempts (auto-cancel at 3)
     * @param serviceName Human-readable service name
     * @param recipientId Unique ID referencing recipient in off-chain database
     * @param recipientAddress Recipient wallet address where payments are sent (required)
     * @param recipientCurrency Recipient currency ticker code (e.g., "PYUSD", "BTC", "ETH", "USDC")
     * @param processorFee Fee amount in PYUSD base units collected per payment to cover gas and platform costs
     * @param processorFeeAddress Address where processor fees are sent (typically contract owner)
     * @param processorFeeCurrency Currency ticker for the processor fee (e.g., "PYUSD")
     * @param processorFeeID Unique ID referencing processor fee structure in off-chain database
     */
    struct Subscription {
        uint256 id;                  // 32 bytes - unique subscription ID
        address senderAddress;        // 20 bytes - user's wallet address
        string senderCurrency;       // dynamic - sender currency ticker (e.g., "PYUSD", "BTC", "ETH", "USDC")
        uint256 senderId;            // 32 bytes - ID referencing sender in off-chain database
        uint256 amount;              // 32 bytes - payment amount in PYUSD base units
        uint256 interval;            // 32 bytes - billing interval in seconds
        uint256 nextPaymentDue;      // 32 bytes - timestamp for next payment
        uint256 endDate;             // 32 bytes - subscription end date (0 = unlimited)
        uint256 maxPayments;         // 32 bytes - max payment count (0 = unlimited)
        uint256 paymentCount;        // 32 bytes - successful payments made
        bool isActive;               // 1 byte - subscription status
        uint8 failedPaymentCount;    // 1 byte - consecutive failures (max 3)
        string serviceName;          // dynamic - human-readable name
        uint256 recipientId;         // 32 bytes - ID referencing recipient in off-chain database
        address recipientAddress;    // 20 bytes - recipient wallet address where payments are sent (required)
        string recipientCurrency;    // dynamic - recipient currency ticker (e.g., "PYUSD", "BTC", "ETH", "USDC")
        uint256 processorFee;        // 32 bytes - processor fee amount in PYUSD base units
        address processorFeeAddress; // 20 bytes - address receiving processor fees
        string processorFeeCurrency; // dynamic - processor fee currency ticker (e.g., "PYUSD")
        uint256 processorFeeID;      // 32 bytes - ID referencing processor fee structure in off-chain database
    }
    
    // ========================================
    // EVENTS
    // ========================================
    
    /**
     * @notice Emitted when a new subscription is created
     * @param subscriptionId Unique ID of the subscription
     * @param senderAddress User's wallet address
     * @param senderId ID of the sender
     * @param recipientId ID of the recipient
     * @param amount Payment amount in PYUSD base units
     * @param interval Billing interval in seconds
     * @param nextPaymentDue Timestamp when first payment is due
     * @param endDate Timestamp when subscription ends (0 = unlimited)
     * @param maxPayments Maximum number of payments (0 = unlimited)
     * @param serviceName Human-readable service name
     * @param recipientAddress Recipient wallet address where payments are sent
     * @param senderCurrency Sender currency ticker code (e.g., "PYUSD")
     * @param recipientCurrency Recipient currency ticker code (e.g., "PYUSD")
     * @param processorFee Processor fee amount in PYUSD base units
     * @param processorFeeAddress Address where processor fees are sent
     * @param processorFeeCurrency Processor fee currency ticker code (e.g., "PYUSD")
     * @param processorFeeID ID referencing processor fee structure
     * @param timestamp Block timestamp when subscription was created
     */
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address senderAddress,
        uint256 indexed senderId,
        uint256 indexed recipientId,
        uint256 amount,
        uint256 interval,
        uint256 nextPaymentDue,
        uint256 endDate,
        uint256 maxPayments,
        string serviceName,
        address recipientAddress,
        string senderCurrency,
        string recipientCurrency,
        uint256 processorFee,
        address processorFeeAddress,
        string processorFeeCurrency,
        uint256 processorFeeID,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a subscription payment is successfully processed
     * @param subscriptionId Unique ID of the subscription
     * @param senderAddress User's wallet address
     * @param senderId ID of the sender
     * @param recipientId ID of the recipient
     * @param amount Payment amount transferred to recipient
     * @param processorFee Processor fee amount transferred
     * @param processorFeeAddress Address that received the processor fee
     * @param paymentCount Total number of successful payments (including this one)
     * @param timestamp Block timestamp when payment was processed
     * @param nextPaymentDue Timestamp when next payment is due
     */
    event PaymentProcessed(
        uint256 indexed subscriptionId,
        address senderAddress,
        uint256 indexed senderId,
        uint256 indexed recipientId,
        uint256 amount,
        uint256 processorFee,
        address processorFeeAddress,
        uint256 paymentCount,
        uint256 timestamp,
        uint256 nextPaymentDue
    );
    
    /**
     * @notice Emitted when a subscription payment fails
     * @param subscriptionId Unique ID of the subscription
     * @param senderAddress User's wallet address
     * @param senderId ID of the sender
     * @param recipientId ID of the recipient
     * @param amount Payment amount that failed
     * @param timestamp Block timestamp when payment failed
     * @param reason Human-readable failure reason
     * @param failedCount Total consecutive failed payment count
     */
    event PaymentFailed(
        uint256 indexed subscriptionId,
        address senderAddress,
        uint256 indexed senderId,
        uint256 indexed recipientId,
        uint256 amount,
        uint256 timestamp,
        string reason,
        uint8 failedCount
    );
    
    /**
     * @notice Emitted when a subscription is cancelled
     * @param subscriptionId Unique ID of the subscription
     * @param senderAddress User's wallet address
     * @param senderId ID of the sender
     * @param recipientId ID of the recipient
     * @param timestamp Block timestamp when subscription was cancelled
     * @param reason Cancellation reason ("user_cancelled", "auto_cancelled_failures", "expired")
     */
    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address senderAddress,
        uint256 indexed senderId,
        uint256 indexed recipientId,
        uint256 timestamp,
        string reason
    );
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    /// @notice PYUSD token contract interface
    /// @dev Immutable - set once in constructor, cannot be changed
    IERC20 public immutable pyusdToken;
    
    /// @notice Counter for generating unique subscription IDs
    /// @dev Increments with each new subscription created
    uint256 private _subscriptionIdCounter;
    
    /// @notice Mapping of subscription ID to Subscription struct
    /// @dev Primary storage for all subscription data
    mapping(uint256 => Subscription) private _subscriptions;
    
    /// @notice Mapping of user address to array of their subscription IDs
    /// @dev Allows efficient lookup of all subscriptions for a given user
    mapping(address => uint256[]) private _userSubscriptions;
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    /**
     * @notice Initialize the contract
     * @param initialOwner Address that will own the contract (for admin functions)
     * @param _pyusdTokenAddress Address of the PYUSD token contract
     * @dev Passes initialOwner to Ownable constructor (required in OpenZeppelin v5.x)
     */
    constructor(address initialOwner, address _pyusdTokenAddress) Ownable(initialOwner) {
        require(_pyusdTokenAddress != address(0), "Invalid PYUSD token address");
        pyusdToken = IERC20(_pyusdTokenAddress);
        _subscriptionIdCounter = 1; // Start subscription IDs at 1 (0 reserved for "not found")
    }
    
    // ========================================
    // CORE SUBSCRIPTION FUNCTIONS
    // ========================================
    
    /**
     * @notice Create a new subscription
     * @param senderId ID of the sender (reference to off-chain database)
     * @param recipientId ID of the recipient (reference to off-chain database)
     * @param amount Payment amount in PYUSD base units (6 decimals)
     * @param interval Billing interval in seconds (e.g., 2592000 = 30 days)
     * @param serviceName Human-readable service name (e.g., "Netflix Premium")
     * @param endDate Unix timestamp when subscription ends (0 = unlimited)
     * @param maxPayments Maximum number of payments before auto-cancel (0 = unlimited)
     * @param recipientAddress Recipient wallet address where payments should be sent
     * @param senderCurrency Sender currency ticker code (e.g., "PYUSD", "BTC", "ETH", "USDC")
     * @param recipientCurrency Recipient currency ticker code (e.g., "PYUSD", "BTC", "ETH", "USDC")
     * @param processorFee Processor fee amount in PYUSD base units (covers gas and platform costs)
     * @param processorFeeAddress Address where processor fees should be sent
     * @param processorFeeCurrency Processor fee currency ticker code (e.g., "PYUSD")
     * @param processorFeeID ID referencing processor fee structure (reference to off-chain database)
     * @return subscriptionId The unique ID of the created subscription
     * @dev User must approve this contract to spend PYUSD (amount + processorFee) before calling this function
     * @dev If both endDate and maxPayments are set, the earlier limit applies
     * @dev If maxPayments is set, endDate will be calculated as: now + (maxPayments * interval)
     * @dev All sender and recipient information comes from off-chain database
     */
    function createSubscription(
        uint256 senderId,
        uint256 recipientId,
        uint256 amount,
        uint256 interval,
        string calldata serviceName,
        uint256 endDate,
        uint256 maxPayments,
        address recipientAddress,
        string calldata senderCurrency,
        string calldata recipientCurrency,
        uint256 processorFee,
        address processorFeeAddress,
        string calldata processorFeeCurrency,
        uint256 processorFeeID
    ) external returns (uint256) {
        // ========================================
        // VALIDATION
        // ========================================
        
        // Validate recipient address is provided
        require(recipientAddress != address(0), "Recipient address required");
        
        // Validate amount is positive
        require(amount > 0, "Amount must be greater than 0");
        
        // Validate interval (minimum 1 day, maximum 1 year for safety)
        require(interval >= 1 days, "Interval must be at least 1 day");
        require(interval <= 365 days, "Interval must be at most 365 days");
        
        // Validate service name is not empty
        require(bytes(serviceName).length > 0, "Service name cannot be empty");
        require(bytes(serviceName).length <= 100, "Service name too long");
        
        // Validate sender currency ticker is provided (required, max 10 characters for ticker symbols)
        require(bytes(senderCurrency).length > 0, "Sender currency is required");
        require(bytes(senderCurrency).length <= 10, "Sender currency ticker too long");
        
        // Validate recipient currency ticker is provided (required, max 10 characters for ticker symbols)
        require(bytes(recipientCurrency).length > 0, "Recipient currency is required");
        require(bytes(recipientCurrency).length <= 10, "Recipient currency ticker too long");
        
        // Validate processor fee address is provided
        require(processorFeeAddress != address(0), "Processor fee address required");
        
        // Validate processor fee currency ticker is provided (required, max 10 characters for ticker symbols)
        require(bytes(processorFeeCurrency).length > 0, "Processor fee currency is required");
        require(bytes(processorFeeCurrency).length <= 10, "Processor fee currency ticker too long");
        
        // Note: processorFee amount can be 0 if the service provider chooses to not charge a fee
        // processorFeeID can also be 0 if not tracked in off-chain database
        
        // Validate end date (if set, must be in future)
        if (endDate > 0) {
            require(endDate > block.timestamp, "End date must be in future");
        }
        
        // Calculate end date from maxPayments if specified
        uint256 calculatedEndDate = endDate;
        if (maxPayments > 0) {
            // Calculate endDate as: now + (maxPayments + 1) * interval
            // This gives time for all maxPayments to be processed
            // +1 because first payment is due after first interval
            uint256 durationFromPayments = block.timestamp + ((maxPayments + 1) * interval);
            // If both are set, use the earlier date
            if (calculatedEndDate == 0 || durationFromPayments < calculatedEndDate) {
                calculatedEndDate = durationFromPayments;
            }
        }
        
        // Calculate total payment amount including processor fee
        uint256 totalPaymentAmount = amount + processorFee;
        
        // Check user has approved sufficient PYUSD allowance for at least one payment (including processor fee)
        uint256 allowance = pyusdToken.allowance(msg.sender, address(this));
        require(allowance >= totalPaymentAmount, "Insufficient PYUSD allowance - approve contract to spend PYUSD (amount + fee)");
        
        // Check user has sufficient PYUSD balance for first payment (including processor fee)
        uint256 balance = pyusdToken.balanceOf(msg.sender);
        require(balance >= totalPaymentAmount, "Insufficient PYUSD balance for first payment (amount + fee)");
        
        // ========================================
        // CREATE SUBSCRIPTION
        // ========================================
        
        // Generate unique subscription ID
        uint256 subscriptionId = _subscriptionIdCounter;
        _subscriptionIdCounter++;
        
        // Calculate first payment due timestamp
        uint256 nextPaymentDue = block.timestamp + interval;
        
        // Create subscription struct
        // All payment information is passed in from off-chain and stored in the subscription
        _subscriptions[subscriptionId] = Subscription({
            id: subscriptionId,
            senderAddress: msg.sender,
            senderCurrency: senderCurrency,
            senderId: senderId,
            amount: amount,
            interval: interval,
            nextPaymentDue: nextPaymentDue,
            endDate: calculatedEndDate,
            maxPayments: maxPayments,
            paymentCount: 0,
            isActive: true,
            failedPaymentCount: 0,
            serviceName: serviceName,
            recipientId: recipientId,
            recipientAddress: recipientAddress,
            recipientCurrency: recipientCurrency,
            processorFee: processorFee,
            processorFeeAddress: processorFeeAddress,
            processorFeeCurrency: processorFeeCurrency,
            processorFeeID: processorFeeID
        });
        
        // Track subscription for user
        _userSubscriptions[msg.sender].push(subscriptionId);
        
        // ========================================
        // EMIT EVENT
        // ========================================
        
        // Access subscription from storage to avoid "stack too deep" error
        Subscription storage sub = _subscriptions[subscriptionId];
        
        emit SubscriptionCreated(
            sub.id,
            sub.senderAddress,
            sub.senderId,
            sub.recipientId,
            sub.amount,
            sub.interval,
            sub.nextPaymentDue,
            sub.endDate,
            sub.maxPayments,
            sub.serviceName,
            sub.recipientAddress,
            sub.senderCurrency,
            sub.recipientCurrency,
            sub.processorFee,
            sub.processorFeeAddress,
            sub.processorFeeCurrency,
            sub.processorFeeID,
            block.timestamp
        );
        
        return subscriptionId;
    }
    
    /**
     * @notice Process a payment for a subscription
     * @param subscriptionId The ID of the subscription to process payment for
     * @dev Can be called by anyone (typically Chainlink Automation or Gelato)
     * @dev Transfers PYUSD directly from sender to recipient's wallet address
     */
    function processPayment(uint256 subscriptionId) external nonReentrant {
        Subscription storage sub = _subscriptions[subscriptionId];
        
        // ========================================
        // VALIDATION
        // ========================================
        
        require(sub.id != 0, "Subscription does not exist");
        require(sub.isActive, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentDue, "Payment not due yet");
        
        // Check if subscription has reached max payments first
        // maxPayments 0 = unlimited payments
        if (sub.maxPayments > 0 && sub.paymentCount >= sub.maxPayments) {
            sub.isActive = false;
            emit SubscriptionCancelled(
                sub.id,
                sub.senderAddress,
                sub.senderId,
                sub.recipientId,
                block.timestamp,
                "expired_max_payments"
            );
            return;
        }

        // Then check if subscription has reached end date
        // endDate 0 = unlimited payments
        if (sub.endDate > 0 && block.timestamp > sub.endDate) {
            sub.isActive = false;
            emit SubscriptionCancelled(
                sub.id,
                sub.senderAddress,
                sub.senderId,
                sub.recipientId,
                block.timestamp,
                "expired_end_date"
            );
            return;
        }
        
        // Get payment address from subscription (always required to be set at creation)
        address paymentAddress = sub.recipientAddress;
        require(paymentAddress != address(0), "Invalid payment address");
        
        // ========================================
        // PROCESS PAYMENT
        // ========================================
        
        // Calculate total payment amount including processor fee
        uint256 totalPaymentAmount = sub.amount + sub.processorFee;
        
        // Check user has sufficient balance (including processor fee)
        uint256 balance = pyusdToken.balanceOf(sub.senderAddress);
        if (balance < totalPaymentAmount) {
            sub.failedPaymentCount++;
            
            emit PaymentFailed(
                sub.id,
                sub.senderAddress,
                sub.senderId,
                sub.recipientId,
                sub.amount,
                block.timestamp,
                "Insufficient PYUSD balance (amount + fee)",
                sub.failedPaymentCount
            );
            
            // Auto-cancel after 3 consecutive failures
            if (sub.failedPaymentCount >= 3) {
                sub.isActive = false;
                emit SubscriptionCancelled(
                    sub.id,
                    sub.senderAddress,
                    sub.senderId,
                    sub.recipientId,
                    block.timestamp,
                    "auto_cancelled_failures"
                );
            }
            
            return;
        }
        
        // Check user has sufficient allowance (including processor fee)
        uint256 allowance = pyusdToken.allowance(sub.senderAddress, address(this));
        if (allowance < totalPaymentAmount) {
            sub.failedPaymentCount++;
            
            emit PaymentFailed(
                sub.id,
                sub.senderAddress,
                sub.senderId,
                sub.recipientId,
                sub.amount,
                block.timestamp,
                "Insufficient PYUSD allowance (amount + fee)",
                sub.failedPaymentCount
            );
            
            // Auto-cancel after 3 consecutive failures
            if (sub.failedPaymentCount >= 3) {
                sub.isActive = false;
                emit SubscriptionCancelled(
                    sub.id,
                    sub.senderAddress,
                    sub.senderId,
                    sub.recipientId,
                    block.timestamp,
                    "auto_cancelled_failures"
                );
            }
            
            return;
        }
        
        // Transfer PYUSD directly from sender to recipient wallet
        bool success = pyusdToken.transferFrom(sub.senderAddress, paymentAddress, sub.amount);
        require(success, "PYUSD transfer failed");
        
        // Transfer processor fee to processor address (if fee > 0)
        if (sub.processorFee > 0) {
            bool feeSuccess = pyusdToken.transferFrom(sub.senderAddress, sub.processorFeeAddress, sub.processorFee);
            require(feeSuccess, "Processor fee transfer failed");
        }

        // ========================================
        // UPDATE STATE & EMIT EVENT
        // ========================================
        
        // Reset failed payment count on successful payment
        sub.failedPaymentCount = 0;
        
        // Increment payment count
        sub.paymentCount++;
        
        // Calculate next payment due
        sub.nextPaymentDue = block.timestamp + sub.interval;
        
        emit PaymentProcessed(
            sub.id,
            sub.senderAddress,
            sub.senderId,
            sub.recipientId,
            sub.amount,
            sub.processorFee,
            sub.processorFeeAddress,
            sub.paymentCount,
            block.timestamp,
            sub.nextPaymentDue
        );
    }
    
    /**
     * @notice Cancel a subscription
     * @param subscriptionId The ID of the subscription to cancel
     * @dev Only the sender can cancel their own subscription
     */
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage sub = _subscriptions[subscriptionId];
        
        require(sub.id != 0, "Subscription does not exist");
        require(sub.senderAddress == msg.sender, "Only sender can cancel");
        require(sub.isActive, "Subscription already cancelled");
        
        sub.isActive = false;
        
        emit SubscriptionCancelled(
            sub.id,
            sub.senderAddress,
            sub.senderId,
            sub.recipientId,
            block.timestamp,
            "user_cancelled"
        );
    }
    
    /**
     * @notice Get all subscription IDs that are due for payment
     * @dev Used by Chainlink Automation or Gelato to determine which subscriptions to process
     * @return Array of subscription IDs that are ready for payment
     */
    function getPaymentsDue() external view returns (uint256[] memory) {
        // First, count how many subscriptions are due
        uint256 dueCount = 0;
        for (uint256 i = 1; i < _subscriptionIdCounter; i++) {
            Subscription storage sub = _subscriptions[i];
            if (sub.isActive && block.timestamp >= sub.nextPaymentDue) {
                dueCount++;
            }
        }
        
        // Create array and populate with due subscription IDs
        uint256[] memory dueSubscriptions = new uint256[](dueCount);
        uint256 index = 0;
        for (uint256 i = 1; i < _subscriptionIdCounter; i++) {
            Subscription storage sub = _subscriptions[i];
            if (sub.isActive && block.timestamp >= sub.nextPaymentDue) {
                dueSubscriptions[index] = i;
                index++;
            }
        }
        
        return dueSubscriptions;
    }
    
    // ========================================
    // VIEW FUNCTIONS - SUBSCRIPTION QUERIES
    // ========================================
    
    /**
     * @notice Get subscription details
     * @param subscriptionId The ID of the subscription
     * @return The subscription struct
     */
    function getSubscription(uint256 subscriptionId) external view returns (Subscription memory) {
        require(_subscriptions[subscriptionId].id != 0, "Subscription does not exist");
        return _subscriptions[subscriptionId];
    }
    
    /**
     * @notice Get all subscription IDs for a user
     * @param user The user's wallet address
     * @return Array of subscription IDs
     */
    function getUserSubscriptions(address user) external view returns (uint256[] memory) {
        return _userSubscriptions[user];
    }
    
}

/**
 * Coding Fortune Cookie: 
 * May your children grieve your death and never the reverse.
 */