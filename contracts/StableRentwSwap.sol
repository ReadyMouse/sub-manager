// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uniswap V2 Router interface for token swaps
interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path) 
        external view returns (uint[] memory amounts);
}

contract StableRentSubscription is ReentrancyGuard, Ownable {
    
    // ========================================
    // STRUCTS (keeping your existing structure)
    // ========================================
    
    struct Subscription {
        uint256 id;
        address senderAddress;
        string senderCurrency;
        uint256 senderId;
        uint256 amount;              // Amount in PYUSD
        uint256 interval;
        uint256 nextPaymentDue;
        uint256 endDate;
        uint256 maxPayments;
        uint256 paymentCount;
        bool isActive;
        uint8 failedPaymentCount;
        string serviceName;
        uint256 recipientId;
        address recipientAddress;
        string recipientCurrency;
        uint256 processorFee;
        address processorFeeAddress;
        string processorFeeCurrency;
        uint256 processorFeeID;
    }
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    IERC20 public immutable pyusdToken;
    IUniswapV2Router02 public immutable uniswapRouter;
    address public immutable WETH;  // WETH address for routing
    
    uint256 private _subscriptionIdCounter;
    mapping(uint256 => Subscription) private _subscriptions;
    mapping(address => uint256[]) private _userSubscriptions;
    
    // Slippage tolerance (in basis points, e.g., 50 = 0.5%)
    uint256 public slippageTolerance = 50;
    
    // ========================================
    // EVENTS
    // ========================================
    
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
    
    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address senderAddress,
        uint256 indexed senderId,
        uint256 indexed recipientId,
        uint256 timestamp,
        string reason
    );
    
    // New event for swap payments
    event PaymentProcessedWithSwap(
        uint256 indexed subscriptionId,
        address inputToken,
        uint256 inputAmount,
        uint256 pyusdReceived,
        uint256 timestamp
    );
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    constructor(
        address initialOwner,
        address _pyusdTokenAddress,
        address _uniswapRouter,
        address _weth
    ) Ownable(initialOwner) {
        require(_pyusdTokenAddress != address(0), "Invalid PYUSD address");
        require(_uniswapRouter != address(0), "Invalid router address");
        require(_weth != address(0), "Invalid WETH address");
        
        pyusdToken = IERC20(_pyusdTokenAddress);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        WETH = _weth;
        _subscriptionIdCounter = 1;
    }
    
    // ========================================
    // CORE FUNCTIONS (keeping your existing)
    // ========================================
    
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
        // [Your existing validation and creation logic]
        require(recipientAddress != address(0), "Recipient address required");
        require(amount > 0, "Amount must be greater than 0");
        require(interval >= 1 days, "Interval must be at least 1 day");
        require(interval <= 365 days, "Interval must be at most 365 days");
        
        uint256 subscriptionId = _subscriptionIdCounter++;
        uint256 nextPaymentDue = block.timestamp + interval;
        
        _subscriptions[subscriptionId] = Subscription({
            id: subscriptionId,
            senderAddress: msg.sender,
            senderCurrency: senderCurrency,
            senderId: senderId,
            amount: amount,
            interval: interval,
            nextPaymentDue: nextPaymentDue,
            endDate: endDate,
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
        
        _userSubscriptions[msg.sender].push(subscriptionId);
        
        // Emit event (simplified for brevity)
        Subscription storage sub = _subscriptions[subscriptionId];
        emit SubscriptionCreated(
            sub.id, sub.senderAddress, sub.senderId, sub.recipientId,
            sub.amount, sub.interval, sub.nextPaymentDue, sub.endDate,
            sub.maxPayments, sub.serviceName, sub.recipientAddress,
            sub.senderCurrency, sub.recipientCurrency, sub.processorFee,
            sub.processorFeeAddress, sub.processorFeeCurrency,
            sub.processorFeeID, block.timestamp
        );
        
        return subscriptionId;
    }
    
    // Your existing processPayment for PYUSD -> PYUSD
    function processPayment(uint256 subscriptionId) external nonReentrant {
        Subscription storage sub = _subscriptions[subscriptionId];
        
        require(sub.id != 0, "Subscription does not exist");
        require(sub.isActive, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentDue, "Payment not due yet");
        
        // [Your existing payment logic]
        uint256 totalPaymentAmount = sub.amount + sub.processorFee;
        
        bool success = pyusdToken.transferFrom(sub.senderAddress, sub.recipientAddress, sub.amount);
        require(success, "PYUSD transfer failed");
        
        if (sub.processorFee > 0) {
            bool feeSuccess = pyusdToken.transferFrom(sub.senderAddress, sub.processorFeeAddress, sub.processorFee);
            require(feeSuccess, "Processor fee transfer failed");
        }
        
        sub.failedPaymentCount = 0;
        sub.paymentCount++;
        sub.nextPaymentDue = block.timestamp + sub.interval;
        
        emit PaymentProcessed(
            sub.id, sub.senderAddress, sub.senderId, sub.recipientId,
            sub.amount, sub.processorFee, sub.processorFeeAddress,
            sub.paymentCount, block.timestamp, sub.nextPaymentDue
        );
    }
    
    // ========================================
    // NEW: SWAP-ENABLED PAYMENT PROCESSING
    // ========================================
    
    /**
     * @notice Process payment by swapping any ERC20 token to PYUSD first
     * @param subscriptionId The subscription to pay for
     * @param inputToken The token to pay with (e.g., USDC, DAI, WETH)
     * @param maxInputAmount Maximum amount of input token user is willing to spend
     * @dev User must approve this contract to spend inputToken before calling
     */
    function processPaymentWithSwap(
        uint256 subscriptionId,
        address inputToken,
        uint256 maxInputAmount
    ) external nonReentrant {
        Subscription storage sub = _subscriptions[subscriptionId];
        
        // Validation (same as processPayment)
        require(sub.id != 0, "Subscription does not exist");
        require(sub.isActive, "Subscription is not active");
        require(block.timestamp >= sub.nextPaymentDue, "Payment not due yet");
        require(inputToken != address(0), "Invalid input token");
        
        // Calculate required PYUSD (amount + processor fee)
        uint256 requiredPYUSD = sub.amount + sub.processorFee;
        
        // Calculate how much input token we need to get required PYUSD
        address[] memory path = _getSwapPath(inputToken, address(pyusdToken));
        uint256[] memory amountsIn = uniswapRouter.getAmountsOut(maxInputAmount, path);
        uint256 estimatedPYUSD = amountsIn[amountsIn.length - 1];
        
        // Check if we can get enough PYUSD
        require(estimatedPYUSD >= requiredPYUSD, "Insufficient swap output");
        
        // Pull input token from user
        IERC20 inputTokenContract = IERC20(inputToken);
        require(
            inputTokenContract.transferFrom(msg.sender, address(this), maxInputAmount),
            "Input token transfer failed"
        );
        
        // Approve Uniswap router to spend input token
        require(
            inputTokenContract.approve(address(uniswapRouter), maxInputAmount),
            "Token approval failed"
        );
        
        // Calculate minimum PYUSD to receive (with slippage protection)
        uint256 minPYUSD = requiredPYUSD * (10000 - slippageTolerance) / 10000;
        
        // Execute swap: inputToken -> PYUSD
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            maxInputAmount,
            minPYUSD,
            path,
            address(this),  // Contract receives PYUSD
            block.timestamp + 300  // 5 minute deadline
        );
        
        uint256 pyusdReceived = amounts[amounts.length - 1];
        
        // Verify we got enough PYUSD
        require(pyusdReceived >= requiredPYUSD, "Insufficient PYUSD from swap");
        
        // Send PYUSD to recipient
        require(
            pyusdToken.transfer(sub.recipientAddress, sub.amount),
            "PYUSD payment failed"
        );
        
        // Send processor fee
        if (sub.processorFee > 0) {
            require(
                pyusdToken.transfer(sub.processorFeeAddress, sub.processorFee),
                "Processor fee payment failed"
            );
        }
        
        // If we got extra PYUSD, refund to user
        uint256 excessPYUSD = pyusdReceived - requiredPYUSD;
        if (excessPYUSD > 0) {
            pyusdToken.transfer(msg.sender, excessPYUSD);
        }
        
        // Update subscription state
        sub.failedPaymentCount = 0;
        sub.paymentCount++;
        sub.nextPaymentDue = block.timestamp + sub.interval;
        
        // Emit events
        emit PaymentProcessedWithSwap(
            sub.id,
            inputToken,
            maxInputAmount,
            pyusdReceived,
            block.timestamp
        );
        
        emit PaymentProcessed(
            sub.id, sub.senderAddress, sub.senderId, sub.recipientId,
            sub.amount, sub.processorFee, sub.processorFeeAddress,
            sub.paymentCount, block.timestamp, sub.nextPaymentDue
        );
    }
    
    /**
     * @notice Get estimated input token amount needed for a subscription payment
     * @param subscriptionId The subscription ID
     * @param inputToken The token user wants to pay with
     * @return estimatedAmount Amount of input token needed (with slippage buffer)
     */
    function estimateInputAmount(
        uint256 subscriptionId,
        address inputToken
    ) external view returns (uint256 estimatedAmount) {
        Subscription storage sub = _subscriptions[subscriptionId];
        require(sub.id != 0, "Subscription does not exist");
        
        uint256 requiredPYUSD = sub.amount + sub.processorFee;
        
        // Get swap path
        address[] memory path = _getSwapPath(inputToken, address(pyusdToken));
        
        // Estimate input needed (add 1% buffer for price movement)
        try uniswapRouter.getAmountsOut(requiredPYUSD, path) returns (uint256[] memory amounts) {
            estimatedAmount = amounts[0] * 101 / 100;  // Add 1% buffer
        } catch {
            revert("Cannot estimate swap amount");
        }
    }
    
    /**
     * @notice Internal helper to construct swap path
     * @dev Routes through WETH if direct pair doesn't exist
     */
    function _getSwapPath(address tokenIn, address tokenOut) 
        private view returns (address[] memory) 
    {
        if (tokenIn == WETH || tokenOut == WETH) {
            // Direct path if one token is WETH
            address[] memory path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
            return path;
        } else {
            // Route through WETH for better liquidity
            address[] memory path = new address[](3);
            path[0] = tokenIn;
            path[1] = WETH;
            path[2] = tokenOut;
            return path;
        }
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    function setSlippageTolerance(uint256 _slippage) external onlyOwner {
        require(_slippage <= 1000, "Slippage too high"); // Max 10%
        slippageTolerance = _slippage;
    }
    
    // ========================================
    // VIEW FUNCTIONS (your existing ones)
    // ========================================
    
    function getSubscription(uint256 subscriptionId) external view returns (Subscription memory) {
        require(_subscriptions[subscriptionId].id != 0, "Subscription does not exist");
        return _subscriptions[subscriptionId];
    }
    
    function getUserSubscriptions(address user) external view returns (uint256[] memory) {
        return _userSubscriptions[user];
    }
    
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage sub = _subscriptions[subscriptionId];
        require(sub.id != 0, "Subscription does not exist");
        require(sub.senderAddress == msg.sender, "Only sender can cancel");
        require(sub.isActive, "Subscription already cancelled");
        
        sub.isActive = false;
        emit SubscriptionCancelled(
            sub.id, sub.senderAddress, sub.senderId, sub.recipientId,
            block.timestamp, "user_cancelled"
        );
    }
}