// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SubscriptionResolver
 * @author StableRent Team
 * @notice Gelato Automation resolver that checks which subscriptions are due for payment
 * @dev This contract implements the Gelato resolver pattern to determine which subscriptions need processing
 * 
 * GELATO PATTERN:
 * - Gelato Network calls checker() periodically (off-chain)
 * - If checker() returns (true, execData), Gelato triggers execution
 * - Execution happens via SubscriptionExecutor contract
 * 
 * KEY FEATURES:
 * - Gas-efficient batch checking of subscriptions
 * - Configurable batch size to prevent gas limit issues
 * - Returns subscription IDs ready for processing
 * - No state changes (pure view function)
 */

interface IStableRentSubscription {
    function getPaymentsDue() external view returns (uint256[] memory);
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

contract SubscriptionResolver {
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    /// @notice Reference to the StableRent subscription contract
    IStableRentSubscription public immutable subscriptionContract;
    
    /// @notice Maximum number of subscriptions to process in one batch
    /// @dev Prevents hitting gas limits on execution
    uint256 public immutable maxBatchSize;
    
    // ========================================
    // EVENTS
    // ========================================
    
    event CheckPerformed(uint256 dueCount, uint256 batchSize, uint256 timestamp);
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    /**
     * @notice Initialize the resolver
     * @param _subscriptionContract Address of the StableRent subscription contract
     * @param _maxBatchSize Maximum number of subscriptions to process in one batch
     */
    constructor(address _subscriptionContract, uint256 _maxBatchSize) {
        require(_subscriptionContract != address(0), "Invalid subscription contract");
        require(_maxBatchSize > 0, "Batch size must be > 0");
        
        subscriptionContract = IStableRentSubscription(_subscriptionContract);
        maxBatchSize = _maxBatchSize;
    }
    
    // ========================================
    // GELATO RESOLVER FUNCTION
    // ========================================
    
    /**
     * @notice Gelato checker function - determines if execution is needed
     * @dev Called off-chain by Gelato Network
     * @return canExec Whether subscriptions are due for payment
     * @return execPayload ABI-encoded subscription IDs to process
     * 
     * GELATO INTEGRATION:
     * 1. Gelato calls this function periodically (every N blocks/seconds)
     * 2. If canExec == true, Gelato triggers the executor contract
     * 3. execPayload is passed to executor's processPayments() function
     */
    function checker() 
        external 
        view 
        returns (bool canExec, bytes memory execPayload) 
    {
        // Get all subscriptions due for payment
        uint256[] memory dueSubscriptions = subscriptionContract.getPaymentsDue();
        
        // If no subscriptions are due, return false
        if (dueSubscriptions.length == 0) {
            return (false, bytes("No payments due"));
        }
        
        // Limit batch size to prevent gas issues
        uint256 batchSize = dueSubscriptions.length > maxBatchSize 
            ? maxBatchSize 
            : dueSubscriptions.length;
        
        // Create batch array
        uint256[] memory batch = new uint256[](batchSize);
        for (uint256 i = 0; i < batchSize; i++) {
            batch[i] = dueSubscriptions[i];
        }
        
        // ABI encode the subscription IDs for executor
        execPayload = abi.encodeWithSelector(
            bytes4(keccak256("processPayments(uint256[])")),
            batch
        );
        
        return (true, execPayload);
    }
    
    /**
     * @notice Get count of subscriptions currently due
     * @dev Helper function for monitoring
     * @return count Number of subscriptions due for payment
     */
    function getPaymentsDueCount() external view returns (uint256 count) {
        uint256[] memory dueSubscriptions = subscriptionContract.getPaymentsDue();
        return dueSubscriptions.length;
    }
    
    /**
     * @notice Get list of subscription IDs currently due
     * @dev Helper function for monitoring and testing
     * @return subscriptionIds Array of subscription IDs due for payment
     */
    function getPaymentsDueList() external view returns (uint256[] memory subscriptionIds) {
        return subscriptionContract.getPaymentsDue();
    }
}

