// Auto-generated ABI file
// Do not edit manually - regenerate from artifacts

export const StableRentSubscriptionABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_pyusdTokenAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "subscriptionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "senderAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "senderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recipientId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "failedCount",
        "type": "uint8"
      }
    ],
    "name": "PaymentFailed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "subscriptionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "senderAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "senderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recipientId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "processorFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "processorFeeAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "paymentCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nextPaymentDue",
        "type": "uint256"
      }
    ],
    "name": "PaymentProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "subscriptionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "senderAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "senderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recipientId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "SubscriptionCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "subscriptionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "senderAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "senderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "recipientId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "interval",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nextPaymentDue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endDate",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxPayments",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "serviceName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "recipientAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "senderCurrency",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "recipientCurrency",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "processorFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "processorFeeAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "processorFeeCurrency",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "processorFeeID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "SubscriptionCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "subscriptionId",
        "type": "uint256"
      }
    ],
    "name": "cancelSubscription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "senderId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "recipientId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "interval",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "serviceName",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "startDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxPayments",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipientAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "senderCurrency",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "recipientCurrency",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "processorFee",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "processorFeeAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "processorFeeCurrency",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "processorFeeID",
        "type": "uint256"
      }
    ],
    "name": "createSubscription",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPaymentsDue",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "subscriptionId",
        "type": "uint256"
      }
    ],
    "name": "getSubscription",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "senderAddress",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "senderCurrency",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "senderId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "interval",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "nextPaymentDue",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxPayments",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "paymentCount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "failedPaymentCount",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "serviceName",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "recipientId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "recipientAddress",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "recipientCurrency",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "processorFee",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "processorFeeAddress",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "processorFeeCurrency",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "processorFeeID",
            "type": "uint256"
          }
        ],
        "internalType": "struct StableRentSubscription.Subscription",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserSubscriptions",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "subscriptionId",
        "type": "uint256"
      }
    ],
    "name": "processPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pyusdToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
