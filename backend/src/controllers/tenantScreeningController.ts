import { Request, Response } from 'express';
import prisma from '../config/database';
import { ethers } from 'ethers';
import { env } from '../config/env';
import path from 'path';
import fs from 'fs';

// Load PYUSD contract address from deployment file
const getDeploymentConfig = () => {
  try {
    // Try both possible paths (source and compiled)
    const possiblePaths = [
      path.join(__dirname, '../../deployments/sepolia.json'),  // From dist/
      path.join(__dirname, '../../../deployments/sepolia.json'), // From dist/controllers/
      path.join(process.cwd(), 'deployments/sepolia.json'), // From project root
    ];
    
    for (const deploymentPath of possiblePaths) {
      if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
        console.log(`✅ Loaded deployment config from: ${deploymentPath}`);
        console.log(`📍 PYUSD Address: ${deployment?.contracts?.PYUSD}`);
        return deployment;
      }
    }
    
    console.error('❌ Could not find deployment file in any expected location');
    console.error('Searched paths:', possiblePaths);
  } catch (error) {
    console.error('Error loading deployment config:', error);
  }
  return null;
};

const deployment = getDeploymentConfig();

// Log deployment status on module load
console.log('\n🔧 Tenant Screening Configuration Check:');
if (env.PYUSD_ADDRESS_SEPOLIA) {
  console.log('✅ PYUSD Address from ENV variable:', env.PYUSD_ADDRESS_SEPOLIA);
} else if (deployment?.contracts?.PYUSD) {
  console.log('✅ PYUSD Address from deployment file:', deployment.contracts.PYUSD);
} else {
  console.error('❌ WARNING: No PYUSD address configured!');
  console.error('   Set PYUSD_ADDRESS_SEPOLIA environment variable or ensure deployments/sepolia.json exists');
}
console.log('');

export class TenantScreeningController {
  /**
   * GET /api/tenant-screening/balance/:walletAddress
   * Get wallet balance for a given address
   */
  static async getWalletBalance(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;

      // Validate wallet address format
      if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
      }

      // Normalize address to checksum format
      const checksumAddress = ethers.getAddress(walletAddress);

      // Connect to blockchain provider - use Sepolia RPC or fallback to public node
      const providerUrl = env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
      const provider = new ethers.JsonRpcProvider(providerUrl);

      // Get ETH balance
      const balanceWei = await provider.getBalance(checksumAddress);
      const balanceEth = ethers.formatEther(balanceWei);

      // Get PYUSD balance - prefer env variable, fallback to deployment config
      let pyusdBalance = '0';
      const pyusdAddress = env.PYUSD_ADDRESS_SEPOLIA || deployment?.contracts?.PYUSD;
      
      console.log(`🔍 Fetching PYUSD balance for ${checksumAddress}`);
      console.log(`   PYUSD Contract Address: ${pyusdAddress || 'NOT CONFIGURED'}`);
      console.log(`   Source: ${env.PYUSD_ADDRESS_SEPOLIA ? 'ENV variable' : deployment?.contracts?.PYUSD ? 'Deployment file' : 'NONE'}`);
      
      if (pyusdAddress) {
        try {
          const pyusdContract = new ethers.Contract(
            pyusdAddress,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );
          const pyusdBalanceWei = await pyusdContract.balanceOf(checksumAddress);
          pyusdBalance = ethers.formatUnits(pyusdBalanceWei, 6); // PYUSD has 6 decimals
          console.log(`   ✅ PYUSD Balance: ${pyusdBalance} PYUSD (${pyusdBalanceWei.toString()} wei)`);
        } catch (error) {
          console.error('   ❌ Error fetching PYUSD balance:', error instanceof Error ? error.message : error);
        }
      } else {
        console.error('   ⚠️  No PYUSD address configured - set PYUSD_ADDRESS_SEPOLIA env variable');
      }

      // Get associated user info if wallet is connected to an account
      const connectedWallet = await prisma.connectedWallet.findFirst({
        where: {
          walletAddress: checksumAddress.toLowerCase(),
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      return res.json({
        address: checksumAddress,
        balances: {
          eth: balanceEth,
          pyusd: pyusdBalance,
        },
        user: connectedWallet?.user || null,
      });
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve wallet balance',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/tenant-screening/subscriptions?username=xxx
   * Get subscription history by username (displayName)
   */
  static async getSubscriptionsByUsername(req: Request, res: Response) {
    try {
      const { username } = req.query;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username query parameter is required' });
      }

      // Find users matching the username (case-insensitive partial match)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              displayName: {
                contains: username,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: username,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          createdAt: true,
        },
        take: 5, // Limit to 5 matches
      });

      if (users.length === 0) {
        return res.json({
          users: [],
          subscriptions: [],
          message: 'No users found matching that username',
        });
      }

      // Get all subscriptions for the found users (both sent and received)
      const userIds = users.map((u) => u.id);
      
      const sentSubscriptions = await prisma.subscription.findMany({
        where: {
          senderId: {
            in: userIds,
          },
        },
        include: {
          recipient: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          payments: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 5, // Latest 5 payments per subscription
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const receivedSubscriptions = await prisma.subscription.findMany({
        where: {
          recipientId: {
            in: userIds,
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          payments: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 5,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate statistics
      const totalSent = sentSubscriptions.filter((s) => s.isActive).length;
      const totalReceived = receivedSubscriptions.filter((s) => s.isActive).length;
      
      const totalPaymentsMade = sentSubscriptions.reduce(
        (sum, sub) => sum + sub.paymentCount,
        0
      );
      const totalPaymentsReceived = receivedSubscriptions.reduce(
        (sum, sub) => sum + sub.paymentCount,
        0
      );

      const failedPayments = sentSubscriptions.reduce(
        (sum, sub) => sum + sub.failedPaymentCount,
        0
      );

      return res.json({
        users,
        subscriptions: {
          sent: sentSubscriptions,
          received: receivedSubscriptions,
        },
        statistics: {
          totalActiveSent: totalSent,
          totalActiveReceived: totalReceived,
          totalPaymentsMade,
          totalPaymentsReceived,
          failedPayments,
          successRate:
            totalPaymentsMade > 0
              ? ((totalPaymentsMade - failedPayments) / totalPaymentsMade) * 100
              : 100,
        },
      });
    } catch (error) {
      console.error('Error getting subscriptions by username:', error);
      return res.status(500).json({
        error: 'Failed to retrieve subscription history',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

