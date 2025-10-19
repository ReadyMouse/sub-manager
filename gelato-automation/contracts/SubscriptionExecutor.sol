// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SubscriptionExecutor
 * @author StableRent Team
 * @notice Gelato Automation executor that processes subscription payments in batches
 * @dev This contract is called by Gelato when the resolver indicates work is needed
 * 
 * GELATO PATTERN:
 * - Gelato Network calls processPayments() when resolver returns true
 * - Processes payments in batches to optimize gas usage
 * - Continues on individual payment failures to maximize throughput
 * - Emits detailed events for monitoring and debugging
 * 
 * KEY FEATURES:
 * - Batch processing of multiple subscriptions
 * - Graceful error handling (logs failures, continues processing)
 * - Only callable by Gelato or owner (for testing)
 * - Gas-optimized for cost-effective automation
 * - Detailed event logging for monitoring
 */

interface IStableRentSubscription {
    function processPayment(uint256 subscriptionId) external;
    function getSubscription(uint256 subscriptionId) external view returns (
        uint256 id,
        address senderAddress,
        string memory senderCurrency,
        uint256 senderId,
        uint256 amount,
        uint256 interval,
        uint256 nextPaymentDue,
        uint256 endDate,
        uint256 maxPayments,
        uint256 paymentCount,
        bool isActive,
        uint8 failedPaymentCount,
        string memory serviceName,
        uint256 recipientId,
        address recipientAddress,
        string memory recipientCurrency,
        uint256 processorFee,
        address processorFeeAddress,
        string memory processorFeeCurrency,
        uint256 processorFeeID
    );
}

contract SubscriptionExecutor is Ownable, ReentrancyGuard {
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    /// @notice Reference to the StableRent subscription contract
    IStableRentSubscription public immutable subscriptionContract;
    
    /// @notice Gelato Network address (authorized to call processPayments)
    address public gelatoExecutor;
    
    /// @notice Track total payments processed
    uint256 public totalPaymentsProcessed;
    
    /// @notice Track total batches executed
    uint256 public totalBatchesExecuted;
    
    /// @notice Track total failures
    uint256 public totalFailures;
    
    // ========================================
    // EVENTS
    // ========================================
    
    event BatchProcessed(
        uint256 batchId,
        uint256 successCount,
        uint256 failureCount,
        uint256 gasUsed,
        uint256 timestamp
    );
    
    event PaymentProcessed(
        uint256 indexed subscriptionId,
        uint256 indexed batchId,
        bool success,
        string reason
    );
    
    event GelatoExecutorUpdated(
        address indexed oldExecutor,
        address indexed newExecutor,
        uint256 timestamp
    );
    
    // ========================================
    // MODIFIERS
    // ========================================
    
    /**
     * @notice Restricts function to Gelato executor or owner
     * @dev Owner access allows for manual testing and emergency processing
     *      Also allows internal calls from processSinglePayment
     */
    modifier onlyGelatoOrOwner() {
        require(
            msg.sender == gelatoExecutor || msg.sender == owner() || msg.sender == address(this),
            "Only Gelato or owner can execute"
        );
        _;
    }
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    /**
     * @notice Initialize the executor
     * @param initialOwner Address that will own the contract
     * @param _subscriptionContract Address of the StableRent subscription contract
     * @param _gelatoExecutor Address of Gelato Network executor
     */
    constructor(
        address initialOwner,
        address _subscriptionContract,
        address _gelatoExecutor
    ) Ownable(initialOwner) {
        require(_subscriptionContract != address(0), "Invalid subscription contract");
        require(_gelatoExecutor != address(0), "Invalid Gelato executor");
        
        subscriptionContract = IStableRentSubscription(_subscriptionContract);
        gelatoExecutor = _gelatoExecutor;
    }
    
    // ========================================
    // CORE EXECUTION FUNCTIONS
    // ========================================
    
    /**
     * @notice Process payments for multiple subscriptions
     * @dev Called by Gelato when resolver indicates work is needed
     * @param subscriptionIds Array of subscription IDs to process
     * @return successCount Number of successful payments
     * @return failureCount Number of failed payments
     * 
     * DESIGN DECISIONS:
     * - Continues processing on individual failures (maximize throughput)
     * - Emits event for each payment attempt (monitoring/debugging)
     * - Returns counts for Gelato logging
     * - Uses try/catch to handle failures gracefully
     */
    function processPayments(uint256[] calldata subscriptionIds) 
        external 
        onlyGelatoOrOwner
        nonReentrant
        returns (uint256 successCount, uint256 failureCount) 
    {
        uint256 startGas = gasleft();
        uint256 batchId = totalBatchesExecuted;
        
        // Process each subscription
        for (uint256 i = 0; i < subscriptionIds.length; i++) {
            uint256 subId = subscriptionIds[i];
            
            try subscriptionContract.processPayment(subId) {
                // Payment succeeded
                successCount++;
                totalPaymentsProcessed++;
                
                emit PaymentProcessed(
                    subId,
                    batchId,
                    true,
                    "Payment processed successfully"
                );
                
            } catch Error(string memory reason) {
                // Payment failed with error message
                failureCount++;
                totalFailures++;
                
                emit PaymentProcessed(
                    subId,
                    batchId,
                    false,
                    reason
                );
                
            } catch (bytes memory /*lowLevelData*/) {
                // Payment failed without error message
                failureCount++;
                totalFailures++;
                
                emit PaymentProcessed(
                    subId,
                    batchId,
                    false,
                    "Unknown error"
                );
            }
        }
        
        // Calculate gas used
        uint256 gasUsed = startGas - gasleft();
        
        // Increment batch counter
        totalBatchesExecuted++;
        
        // Emit batch summary
        emit BatchProcessed(
            batchId,
            successCount,
            failureCount,
            gasUsed,
            block.timestamp
        );
        
        return (successCount, failureCount);
    }
    
    /**
     * @notice Process a single payment (for testing/manual intervention)
     * @param subscriptionId The subscription ID to process
     * @dev Only callable by owner for emergency situations
     *      Note: nonReentrant protection is provided by processPayments
     */
    function processSinglePayment(uint256 subscriptionId) 
        external 
        onlyOwner
    {
        uint256[] memory batch = new uint256[](1);
        batch[0] = subscriptionId;
        this.processPayments(batch);
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    /**
     * @notice Update Gelato executor address
     * @param _gelatoExecutor New Gelato executor address
     * @dev Only callable by owner
     */
    function updateGelatoExecutor(address _gelatoExecutor) external onlyOwner {
        require(_gelatoExecutor != address(0), "Invalid Gelato executor");
        
        address oldExecutor = gelatoExecutor;
        gelatoExecutor = _gelatoExecutor;
        
        emit GelatoExecutorUpdated(oldExecutor, _gelatoExecutor, block.timestamp);
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    /**
     * @notice Get executor statistics
     * @return processed Total payments processed
     * @return batches Total batches executed
     * @return failures Total failures
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 processed,
            uint256 batches,
            uint256 failures
        ) 
    {
        return (
            totalPaymentsProcessed,
            totalBatchesExecuted,
            totalFailures
        );
    }
}

