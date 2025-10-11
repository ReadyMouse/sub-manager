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
 * - Supports multiple payment types: Direct Crypto, Gift Cards, Manual Entry
 * - Emits events for Envio indexer to track subscription lifecycle
 * 
 * FLOW:
 * 1. User approves SubChain contract to spend PYUSD (one-time)
 * 2. User calls createSubscription() to start subscription
 * 3. Service provider/bot calls processPayment() when billing is due
 * 4. Contract pulls payment from user wallet via transferFrom()
 * 5. User can cancel anytime via cancelSubscription()
 */
contract SubChainSubscription is ReentrancyGuard, Ownable {
    // ========================================
    // ENUMS & STRUCTS
    // ========================================
    
    /**
     * @notice Provider type enum for different service provider categories
     * @dev Three types to distinguish verified, unverified public, and private providers
     */
    enum ProviderType {
        PublicVerified,    // 0: Owner-approved provider, any payment type (e.g., Netflix, Spotify, verified creators)
        PublicUnverified,  // 1: Self-registered public provider, DirectCrypto only (e.g., GoFundMe, unverified creators)
        Private            // 2: Self-registered private provider, DirectCrypto only (e.g., landlord, child's allowance)
    }
    
    /**
     * @notice Payment type enum for different subscription integration methods
     * @dev Used in Subscription struct to determine how payment should be processed
     */
    enum PaymentType {
        DirectCrypto,        // 0: Service accepts PYUSD directly (e.g., Alchemy, Mintstars)
        AutomatedGiftCard,   // 1: Auto-purchase gift card via Bitrefill API (e.g., Netflix)
        ManualEntry          // 2: User manually enters payment details (universal fallback)
    }
    
    /**
     * @notice Core subscription data structure
     * @dev Packed for gas optimization where possible (per TC-2 in PRD)
     * @dev Analytics fields (createdAt, lastPaymentTime) calculated from events via Envio
     * @param id Unique subscription ID (same as mapping key, included for convenience)
     * @param subscriber User's wallet address who created the subscription
     * @param serviceProviderId Unique ID referencing service provider in external registry/database
     * @param amount Payment amount in PYUSD base units (6 decimals, e.g., 10 PYUSD = 10000000)
     * @param interval Billing interval in seconds (e.g., 30 days = 2592000)
     * @param nextPaymentDue Unix timestamp when next payment is due
     * @param endDate Unix timestamp when subscription ends (0 = no expiration, runs indefinitely)
     * @param maxPayments Maximum number of payments before auto-cancel (0 = unlimited)
     * @param paymentCount Number of successful payments made so far
     * @param isActive Whether subscription is currently active (false = cancelled)
     * @param isPrivate Privacy flag - if true, encrypt all data (serviceName, amount, addresses) for ZK-proof usage
     * @param failedPaymentCount Consecutive failed payment attempts (auto-cancel at 3)
     * @param serviceName Human-readable service name (encrypted if isPrivate is true)
     */
    struct Subscription {
        uint256 id;                  // 32 bytes - unique subscription ID
        address subscriber;           // 20 bytes - user's wallet address
        uint256 serviceProviderId;   // 32 bytes - ID referencing service provider registry (payment details stored off-chain/separate mapping)
        uint256 amount;              // 32 bytes - payment amount in PYUSD base units
        uint256 interval;            // 32 bytes - billing interval in seconds
        uint256 nextPaymentDue;      // 32 bytes - timestamp for next payment
        uint256 endDate;             // 32 bytes - subscription end date (0 = unlimited)
        uint256 maxPayments;         // 32 bytes - max payment count (0 = unlimited)
        uint256 paymentCount;        // 32 bytes - successful payments made
        bool isActive;               // 1 byte - subscription status
        bool isPrivate;              // 1 byte - privacy flag: if true, as much as possible encrypted/ZK-proofs
        uint8 failedPaymentCount;    // 1 byte - consecutive failures (max 3)
        string serviceName;          // dynamic - human-readable name (encrypted if isPrivate is true)
    }
    
    // ========================================
    // EVENTS
    // ========================================
    
    /**
     * @notice Emitted when a new subscription is created
     * @param subscriptionId Unique ID of the subscription
     * @param subscriber User's wallet address
     * @param serviceProviderId ID of the service provider
     * @param amount Payment amount in PYUSD base units
     * @param interval Billing interval in seconds
     * @param nextPaymentDue Timestamp when first payment is due
     * @param endDate Timestamp when subscription ends (0 = unlimited)
     * @param maxPayments Maximum number of payments (0 = unlimited)
     * @param serviceName Human-readable service name
     * @param isPrivate Whether subscription uses privacy features
     * @param timestamp Block timestamp when subscription was created
     */
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 indexed serviceProviderId,
        uint256 amount,
        uint256 interval,
        uint256 nextPaymentDue,
        uint256 endDate,
        uint256 maxPayments,
        string serviceName,
        bool isPrivate,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a subscription payment is successfully processed
     * @param subscriptionId Unique ID of the subscription
     * @param subscriber User's wallet address
     * @param serviceProviderId ID of the service provider
     * @param amount Payment amount transferred
     * @param paymentCount Total number of successful payments (including this one)
     * @param timestamp Block timestamp when payment was processed
     * @param nextPaymentDue Timestamp when next payment is due
     */
    event PaymentProcessed(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 indexed serviceProviderId,
        uint256 amount,
        uint256 paymentCount,
        uint256 timestamp,
        uint256 nextPaymentDue
    );
    
    /**
     * @notice Emitted when a subscription payment fails
     * @param subscriptionId Unique ID of the subscription
     * @param subscriber User's wallet address
     * @param serviceProviderId ID of the service provider
     * @param amount Payment amount that failed
     * @param timestamp Block timestamp when payment failed
     * @param reason Human-readable failure reason
     * @param failedCount Total consecutive failed payment count
     */
    event PaymentFailed(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 indexed serviceProviderId,
        uint256 amount,
        uint256 timestamp,
        string reason,
        uint8 failedCount
    );
    
    /**
     * @notice Emitted when a subscription is cancelled
     * @param subscriptionId Unique ID of the subscription
     * @param subscriber User's wallet address
     * @param serviceProviderId ID of the service provider
     * @param timestamp Block timestamp when subscription was cancelled
     * @param reason Cancellation reason ("user_cancelled", "auto_cancelled_failures", "expired")
     */
    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 indexed serviceProviderId,
        uint256 timestamp,
        string reason
    );
    
    /**
     * @notice Emitted when a service provider is registered or updated
     * @param serviceProviderId Unique ID of the service provider
     * @param paymentAddress Wallet address where payments are sent
     * @param providerType Type of provider (0=PublicVerified, 1=PublicUnverified, 2=Private)
     * @param paymentType Integration method (0=DirectCrypto, 1=AutomatedGiftCard, 2=ManualEntry)
     * @param providerOwner Address of the user who created the provider (address(0) for PublicVerified)
     * @param timestamp Block timestamp when provider was registered/updated
     */
    event ServiceProviderUpdated(
        uint256 indexed serviceProviderId,
        address indexed paymentAddress,
        ProviderType providerType,
        PaymentType paymentType,
        address providerOwner,
        uint256 timestamp
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
    
    /// @notice Mapping of service provider ID to wallet address
    /// @dev Separates service provider identity from payment destination
    /// @dev Allows service providers to update payment address without affecting subscriptions
    mapping(uint256 => address) private _serviceProviderAddresses;
    
    /// @notice Mapping to track if a service provider ID exists
    /// @dev Used for validation when creating subscriptions
    mapping(uint256 => bool) private _serviceProviderExists;
    
    /// @notice Mapping of service provider ID to provider type
    /// @dev Distinguishes between PublicVerified, PublicUnverified, and Private providers
    mapping(uint256 => ProviderType) private _serviceProviderTypes;
    
    /// @notice Mapping of service provider ID to the user who created it
    /// @dev Only populated for PublicUnverified and Private providers, address(0) for PublicVerified
    mapping(uint256 => address) private _serviceProviderOwners;
    
    /// @notice Mapping of service provider ID to payment integration method
    /// @dev Defines how payments are processed (DirectCrypto, AutomatedGiftCard, ManualEntry)
    mapping(uint256 => PaymentType) private _serviceProviderPaymentTypes;
    
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
    // ADMIN FUNCTIONS
    // ========================================
    
    /**
     * @notice Register or update a verified public service provider (e.g., Netflix, Spotify, verified creators)
     * @param serviceProviderId Unique ID for the service provider
     * @param paymentAddress Wallet address where payments should be sent
     * @param paymentType Integration method (0=DirectCrypto, 1=AutomatedGiftCard, 2=ManualEntry)
     * @dev Only contract owner can register verified public service providers
     * @dev Verified providers can use any payment type
     */
    function registerServiceProvider(
        uint256 serviceProviderId, 
        address paymentAddress,
        PaymentType paymentType
    ) external onlyOwner {
        require(serviceProviderId > 0, "Invalid service provider ID");
        require(paymentAddress != address(0), "Invalid payment address");
        
        _serviceProviderAddresses[serviceProviderId] = paymentAddress;
        _serviceProviderExists[serviceProviderId] = true;
        _serviceProviderTypes[serviceProviderId] = ProviderType.PublicVerified;
        _serviceProviderOwners[serviceProviderId] = address(0); // Verified providers have no individual owner
        _serviceProviderPaymentTypes[serviceProviderId] = paymentType;
        
        emit ServiceProviderUpdated(
            serviceProviderId, 
            paymentAddress, 
            ProviderType.PublicVerified,
            paymentType,
            address(0), 
            block.timestamp
        );
    }
    
    /**
     * @notice Register an unverified public provider (e.g., GoFundMe, content creator, anyone accepting donations)
     * @param paymentAddress Wallet address where payments should be sent
     * @return serviceProviderId The unique ID assigned to this provider
     * @dev Any user can register an unverified public provider
     * @dev These providers are shareable and appear in public listings with "unverified" status
     * @dev Provider ID is generated as: hash(msg.sender, paymentAddress, block.timestamp, "unverified")
     * @dev Unverified public providers always use DirectCrypto only
     */
    function registerPublicUnverifiedProvider(address paymentAddress) external returns (uint256) {
        require(paymentAddress != address(0), "Invalid payment address");
        
        // Generate unique provider ID using hash of user, payment address, timestamp, and type marker
        uint256 serviceProviderId = uint256(keccak256(abi.encodePacked(
            msg.sender,
            paymentAddress,
            block.timestamp,
            "unverified"
        )));
        
        // Ensure ID doesn't collide (extremely unlikely, but check anyway)
        require(!_serviceProviderExists[serviceProviderId], "Provider ID collision");
        
        _serviceProviderAddresses[serviceProviderId] = paymentAddress;
        _serviceProviderExists[serviceProviderId] = true;
        _serviceProviderTypes[serviceProviderId] = ProviderType.PublicUnverified;
        _serviceProviderOwners[serviceProviderId] = msg.sender;
        _serviceProviderPaymentTypes[serviceProviderId] = PaymentType.DirectCrypto; // Unverified providers only use DirectCrypto
        
        emit ServiceProviderUpdated(
            serviceProviderId, 
            paymentAddress, 
            ProviderType.PublicUnverified,
            PaymentType.DirectCrypto,
            msg.sender, 
            block.timestamp
        );
        
        return serviceProviderId;
    }
    
    /**
     * @notice Register a private provider for personal peer-to-peer payments (e.g., landlord, child's allowance)
     * @param paymentAddress Wallet address where payments should be sent
     * @return serviceProviderId The unique ID assigned to this provider
     * @dev Any user can register private providers for personal subscriptions
     * @dev These providers are NOT shown in public listings, only in the user's personal list
     * @dev Provider ID is generated as: hash(msg.sender, paymentAddress, block.timestamp, "private")
     * @dev Private providers always use DirectCrypto only
     */
    function registerPrivateProvider(address paymentAddress) external returns (uint256) {
        require(paymentAddress != address(0), "Invalid payment address");
        
        // Generate unique provider ID using hash of user, payment address, timestamp, and type marker
        uint256 serviceProviderId = uint256(keccak256(abi.encodePacked(
            msg.sender,
            paymentAddress,
            block.timestamp,
            "private"
        )));
        
        // Ensure ID doesn't collide (extremely unlikely, but check anyway)
        require(!_serviceProviderExists[serviceProviderId], "Provider ID collision");
        
        _serviceProviderAddresses[serviceProviderId] = paymentAddress;
        _serviceProviderExists[serviceProviderId] = true;
        _serviceProviderTypes[serviceProviderId] = ProviderType.Private;
        _serviceProviderOwners[serviceProviderId] = msg.sender;
        _serviceProviderPaymentTypes[serviceProviderId] = PaymentType.DirectCrypto; // Private providers only use DirectCrypto
        
        emit ServiceProviderUpdated(
            serviceProviderId, 
            paymentAddress, 
            ProviderType.Private,
            PaymentType.DirectCrypto,
            msg.sender, 
            block.timestamp
        );
        
        return serviceProviderId;
    }
    
    // ========================================
    // CORE SUBSCRIPTION FUNCTIONS
    // ========================================
    
    /**
     * @notice Create a new subscription
     * @param serviceProviderId ID of the service provider to subscribe to
     * @param amount Payment amount in PYUSD base units (6 decimals)
     * @param interval Billing interval in seconds (e.g., 2592000 = 30 days)
     * @param serviceName Human-readable service name (e.g., "Netflix Premium")
     * @param endDate Unix timestamp when subscription ends (0 = unlimited)
     * @param maxPayments Maximum number of payments before auto-cancel (0 = unlimited)
     * @param isPrivate Whether to use privacy features (encryption/ZK-proofs)
     * @return subscriptionId The unique ID of the created subscription
     * @dev User must approve this contract to spend PYUSD before calling this function
     * @dev If both endDate and maxPayments are set, the earlier limit applies
     * @dev If maxPayments is set, endDate will be calculated as: now + (maxPayments * interval)
     * @dev Payment integration method is determined by the service provider's paymentType
     */
    function createSubscription(
        uint256 serviceProviderId,
        uint256 amount,
        uint256 interval,
        string calldata serviceName,
        uint256 endDate,
        uint256 maxPayments,
        bool isPrivate
    ) external returns (uint256) {
        // ========================================
        // VALIDATION
        // ========================================
        
        // Validate service provider exists
        require(_serviceProviderExists[serviceProviderId], "Service provider not registered");
        
        // Validate amount is positive
        require(amount > 0, "Amount must be greater than 0");
        
        // Validate interval (minimum 1 day, maximum 1 year for safety)
        require(interval >= 1 days, "Interval must be at least 1 day");
        require(interval <= 365 days, "Interval must be at most 365 days");
        
        // Validate service name is not empty
        require(bytes(serviceName).length > 0, "Service name cannot be empty");
        require(bytes(serviceName).length <= 100, "Service name too long");
        
        // Validate end date (if set, must be in future)
        if (endDate > 0) {
            require(endDate > block.timestamp, "End date must be in future");
        }
        
        // Calculate end date from maxPayments if specified
        uint256 calculatedEndDate = endDate;
        if (maxPayments > 0) {
            uint256 durationFromPayments = block.timestamp + (maxPayments * interval);
            // If both are set, use the earlier date
            if (calculatedEndDate == 0 || durationFromPayments < calculatedEndDate) {
                calculatedEndDate = durationFromPayments;
            }
        }
        
        // Check user has approved sufficient PYUSD allowance for at least one payment
        uint256 allowance = pyusdToken.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient PYUSD allowance - approve contract to spend PYUSD");
        
        // Check user has sufficient PYUSD balance for first payment
        uint256 balance = pyusdToken.balanceOf(msg.sender);
        require(balance >= amount, "Insufficient PYUSD balance for first payment");
        
        // ========================================
        // CREATE SUBSCRIPTION
        // ========================================
        
        // Generate unique subscription ID
        uint256 subscriptionId = _subscriptionIdCounter;
        _subscriptionIdCounter++;
        
        // Calculate first payment due timestamp
        uint256 nextPaymentDue = block.timestamp + interval;
        
        // Create subscription struct
        _subscriptions[subscriptionId] = Subscription({
            id: subscriptionId,
            subscriber: msg.sender,
            serviceProviderId: serviceProviderId,
            amount: amount,
            interval: interval,
            nextPaymentDue: nextPaymentDue,
            endDate: calculatedEndDate,
            maxPayments: maxPayments,
            paymentCount: 0,
            isActive: true,
            isPrivate: isPrivate,
            failedPaymentCount: 0,
            serviceName: serviceName
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
            sub.subscriber,
            sub.serviceProviderId,
            sub.amount,
            sub.interval,
            sub.nextPaymentDue,
            sub.endDate,
            sub.maxPayments,
            sub.serviceName,
            sub.isPrivate,
            block.timestamp
        );
        
        return subscriptionId;
    }
    
    /**
     * @notice Process a payment for a subscription
     * @param subscriptionId The ID of the subscription to process payment for
     * @dev Can be called by anyone (typically Chainlink Automation or Gelato)
     * @dev Payment handling varies by service provider's integration method:
     *      - DirectCrypto: Transfer to service provider, payment complete
     *      - AutomatedGiftCard: Transfer to service provider, emit event for off-chain Bitrefill API call
     *      - ManualEntry: Transfer to intermediary/treasury, emit event for off-chain virtual card generation
     * @dev Payment integration method is determined by querying the service provider's paymentType
     */
    function processPayment(uint256 subscriptionId) external nonReentrant {
        Subscription storage sub = _subscriptions[subscriptionId];
        
        // ========================================
        // VALIDATION
        // ========================================
        
        require(sub.id != 0, "Subscription does not exist");
        require(sub.isActive, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentDue, "Payment not due yet");
        
        // Check if subscription has reached end date
        // endDate 0 = unlimited payments
        if (sub.endDate > 0 && block.timestamp > sub.endDate) {
            sub.isActive = false;
            emit SubscriptionCancelled(
                sub.id,
                sub.subscriber,
                sub.serviceProviderId,
                block.timestamp,
                "expired_end_date"
            );
            return;
        }
        
        // Check if subscription has reached max payments
        // maxPayments 0 = unlimited payments
        if (sub.maxPayments > 0 && sub.paymentCount >= sub.maxPayments) {
            sub.isActive = false;
            emit SubscriptionCancelled(
                sub.id,
                sub.subscriber,
                sub.serviceProviderId,
                block.timestamp,
                "expired_max_payments"
            );
            return;
        }
        
        // Get service provider payment address
        address paymentAddress = _serviceProviderAddresses[sub.serviceProviderId];
        require(paymentAddress != address(0), "Invalid service provider address");
        
        // ========================================
        // PROCESS PAYMENT
        // ========================================
        
        // Check user has sufficient balance
        uint256 balance = pyusdToken.balanceOf(sub.subscriber);
        if (balance < sub.amount) {
            sub.failedPaymentCount++;
            
            emit PaymentFailed(
                sub.id,
                sub.subscriber,
                sub.serviceProviderId,
                sub.amount,
                block.timestamp,
                "Insufficient PYUSD balance",
                sub.failedPaymentCount
            );
            
            // Auto-cancel after 3 consecutive failures
            if (sub.failedPaymentCount >= 3) {
                sub.isActive = false;
                emit SubscriptionCancelled(
                    sub.id,
                    sub.subscriber,
                    sub.serviceProviderId,
                    block.timestamp,
                    "auto_cancelled_failures"
                );
            }
            
            return;
        }
        
        // Check user has sufficient allowance
        uint256 allowance = pyusdToken.allowance(sub.subscriber, address(this));
        if (allowance < sub.amount) {
            sub.failedPaymentCount++;
            
            emit PaymentFailed(
                sub.id,
                sub.subscriber,
                sub.serviceProviderId,
                sub.amount,
                block.timestamp,
                "Insufficient PYUSD allowance",
                sub.failedPaymentCount
            );
            
            // Auto-cancel after 3 consecutive failures
            if (sub.failedPaymentCount >= 3) {
                sub.isActive = false;
                emit SubscriptionCancelled(
                    sub.id,
                    sub.subscriber,
                    sub.serviceProviderId,
                    block.timestamp,
                    "auto_cancelled_failures"
                );
            }
            
            return;
        }
        
        // Transfer PYUSD from subscriber to service provider
        // Note: All payment types (DirectCrypto, AutomatedGiftCard, ManualEntry) 
        // transfer on-chain first. Off-chain processing happens based on payment type:
        // - DirectCrypto: Nothing else needed, payment complete
        // - AutomatedGiftCard: Backend listens to PaymentProcessed event, calls Bitrefill API
        // - ManualEntry: Backend listens to PaymentProcessed event, generates virtual card details
        bool success = pyusdToken.transferFrom(sub.subscriber, paymentAddress, sub.amount);
        require(success, "PYUSD transfer failed");
        
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
            sub.subscriber,
            sub.serviceProviderId,
            sub.amount,
            sub.paymentCount,
            block.timestamp,
            sub.nextPaymentDue
        );
    }
    
    /**
     * @notice Cancel a subscription
     * @param subscriptionId The ID of the subscription to cancel
     * @dev Only the subscriber can cancel their own subscription
     */
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage sub = _subscriptions[subscriptionId];
        
        require(sub.id != 0, "Subscription does not exist");
        require(sub.subscriber == msg.sender, "Only subscriber can cancel");
        require(sub.isActive, "Subscription already cancelled");
        
        sub.isActive = false;
        
        emit SubscriptionCancelled(
            sub.id,
            sub.subscriber,
            sub.serviceProviderId,
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
    
    // ========================================
    // VIEW FUNCTIONS - SERVICE PROVIDER QUERIES
    // ========================================
    
    /**
     * @notice Get the payment address for a service provider
     * @param serviceProviderId The ID of the service provider
     * @return The payment address for this provider
     */
    function getProviderAddress(uint256 serviceProviderId) external view returns (address) {
        require(_serviceProviderExists[serviceProviderId], "Service provider does not exist");
        return _serviceProviderAddresses[serviceProviderId];
    }
    
    /**
     * @notice Get the type of a service provider
     * @param serviceProviderId The ID of the service provider
     * @return The provider type (0=PublicVerified, 1=PublicUnverified, 2=Private)
     */
    function getProviderType(uint256 serviceProviderId) external view returns (ProviderType) {
        require(_serviceProviderExists[serviceProviderId], "Service provider does not exist");
        return _serviceProviderTypes[serviceProviderId];
    }
    
    /**
     * @notice Get the owner of a provider
     * @param serviceProviderId The ID of the service provider
     * @return The address of the user who created this provider (address(0) for PublicVerified providers)
     */
    function getProviderOwner(uint256 serviceProviderId) external view returns (address) {
        require(_serviceProviderExists[serviceProviderId], "Service provider does not exist");
        return _serviceProviderOwners[serviceProviderId];
    }
    
    /**
     * @notice Check if a service provider exists
     * @param serviceProviderId The ID of the service provider
     * @return True if the provider exists, false otherwise
     */
    function providerExists(uint256 serviceProviderId) external view returns (bool) {
        return _serviceProviderExists[serviceProviderId];
    }
    
    /**
     * @notice Get the payment integration method for a service provider
     * @param serviceProviderId The ID of the service provider
     * @return The payment type (0=DirectCrypto, 1=AutomatedGiftCard, 2=ManualEntry)
     */
    function getProviderPaymentType(uint256 serviceProviderId) external view returns (PaymentType) {
        require(_serviceProviderExists[serviceProviderId], "Service provider does not exist");
        return _serviceProviderPaymentTypes[serviceProviderId];
    }
}

