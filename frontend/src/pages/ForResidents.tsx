import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Database, Wallet, ArrowRight, TrendingUp } from 'lucide-react';

export const ForResidents: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-navy rounded-2xl p-12 mb-12 shadow-strong text-white">
        <h1 className="text-5xl font-bold mb-4">
          Pay Rent with Digital Currency
        </h1>
        <p className="text-xl text-white/90 mb-6">
          Whether your landlord suggested it or you're interested in using digital currency for rent, 
          this guide will help you understand the benefits and how to get started.
        </p>
      </div>

      {/* Overview Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-brand-navy mb-6">
          Why Pay Rent with Stablecoins?
        </h2>
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-brand-teal/10 rounded-lg p-3">
              <TrendingUp className="w-8 h-8 text-brand-teal" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-navy mb-2">
                The Digital Currency Revolution
              </h3>
              <p className="text-gray-700 leading-relaxed">
                The digital currency market has grown to a <strong>multi-trillion dollar ecosystem</strong>, 
                with stablecoins like PYUSD (PayPal USD) offering the perfect bridge between traditional 
                finance and blockchain technology. Stablecoins maintain a 1:1 peg with the US dollar, 
                combining the stability of USD with the benefits of blockchain technology.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-brand-sage/5 rounded-lg p-6 border border-brand-sage/20">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-bold text-brand-navy mb-2">Price Stability</h4>
              <p className="text-gray-600 text-sm">
                Unlike Bitcoin or Ethereum, PYUSD maintains a stable $1.00 value, 
                eliminating digital currency volatility concerns.
              </p>
            </div>
            <div className="bg-brand-teal/5 rounded-lg p-6 border border-brand-teal/20">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-bold text-brand-navy mb-2">Fast Transfers</h4>
              <p className="text-gray-600 text-sm">
                Payments are processed on the blockchain in minutes, not days like traditional 
                bank transfers.
              </p>
            </div>
            <div className="bg-brand-navy/5 rounded-lg p-6 border border-brand-navy/20">
              <div className="text-3xl mb-3">🔄</div>
              <h4 className="font-bold text-brand-navy mb-2">Easy Conversion</h4>
              <p className="text-gray-600 text-sm">
                Convert between USD and PYUSD instantly through PayPal with no blockchain 
                knowledge required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Benefits Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-brand-navy mb-6">
          Blockchain Benefits for Renters
        </h2>

        {/* Proof of Funds */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-sage/10 rounded-lg p-3">
              <Wallet className="w-8 h-8 text-brand-sage" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Public Account Balances = Proof of Funds
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All blockchain transactions and balances are publicly viewable. While this might seem 
                concerning at first, it actually provides significant benefits for renters:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Instant Financial Verification:</strong> Show potential landlords you have 
                    the financial capacity to pay rent without sharing sensitive bank statements
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>No Identity Required:</strong> Your wallet address doesn't reveal your 
                    name, social security number, or personal information
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Competitive Advantage:</strong> Stand out in competitive rental markets 
                    by demonstrating financial responsibility
                  </span>
                </li>
              </ul>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Privacy Note:</strong> While balances are public, they're tied to wallet addresses, 
                  not your identity. You control how much information you share about which addresses belong to you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Proof of Payment */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-teal/10 rounded-lg p-3">
              <Database className="w-8 h-8 text-brand-teal" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Permanent Records = Proof of On-Time Payments
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Blockchain transactions are immutable and permanent. Once recorded, they cannot be 
                altered or deleted. This creates a powerful tool for renters:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Indisputable Payment History:</strong> Build a verifiable track record 
                    of on-time rent payments that follows you forever
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Future Rental Applications:</strong> Show prospective landlords your 
                    complete payment history with timestamps proving punctuality
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Credit Building Alternative:</strong> Create a payment history even if 
                    traditional credit reporting doesn't capture rent payments
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Dispute Protection:</strong> No more "he said, she said" – the blockchain 
                    is the ultimate receipt
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Automation Benefits */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="bg-brand-navy/10 rounded-lg p-3">
              <Shield className="w-8 h-8 text-brand-navy" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Automated Payments with Full Control
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Unlike traditional recurring payments where you give someone permission to withdraw 
                from your account, blockchain subscriptions work differently:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Self-Custody:</strong> You maintain complete control of your funds until 
                    payment is due
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Transparent Smart Contracts:</strong> The payment rules are written in 
                    code that anyone can verify
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Cancel Anytime:</strong> Stop payments immediately without needing landlord 
                    approval or bank intervention
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How-To Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-brand-navy mb-6">
          Getting Started: Step-by-Step Guide
        </h2>

        {/* Step 1 */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-sage rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">1</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Convert USD to PYUSD in PayPal
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  PYUSD is PayPal's stablecoin, available directly in the PayPal app. Converting is simple:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Open the PayPal mobile app (iOS or Android)</li>
                  <li>Tap on the <strong>"Crypto"</strong> tab at the bottom of the screen</li>
                  <li>Select <strong>"PayPal USD (PYUSD)"</strong> from the list of digital currencies</li>
                  <li>Tap <strong>"Buy"</strong></li>
                  <li>Enter the amount you want to convert (e.g., $1,500 for rent)</li>
                  <li>Review the conversion rate (should be 1:1 with USD)</li>
                  <li>Confirm the purchase</li>
                </ol>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm">
                    <strong>💡 Pro Tip:</strong> PayPal's conversion from USD to PYUSD typically has minimal 
                    fees and happens instantly. You can buy exactly the amount you need for rent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-teal rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">2</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Transfer PYUSD to MetaMask (or Another Self-Custody Wallet)
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  To set up automated payments, you need to move your PYUSD from PayPal to a browser-based 
                  wallet like MetaMask:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-bold mb-2">First, Set Up MetaMask:</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Install the MetaMask browser extension from <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">metamask.io</a></li>
                    <li>Create a new wallet and securely save your recovery phrase (12 or 24 words)</li>
                    <li>Set up a strong password</li>
                    <li>Switch to the <strong>Ethereum network</strong> (where PYUSD operates)</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Then, Transfer from PayPal to MetaMask:</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Copy your MetaMask wallet address (click on it to copy)</li>
                    <li>Open PayPal app and go to <strong>Crypto → PYUSD</strong></li>
                    <li>Tap <strong>"Transfer"</strong> or <strong>"Send"</strong></li>
                    <li>Select <strong>"To external wallet"</strong></li>
                    <li>Paste your MetaMask address</li>
                    <li>Enter the amount to transfer</li>
                    <li>Review the small network fee (usually a few dollars)</li>
                    <li>Confirm the transfer</li>
                    <li>Wait 3-10 minutes for the transfer to complete</li>
                  </ol>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm">
                    <strong>⚠️ Important:</strong> Always send a small test amount first (like $5) to make 
                    sure you have the correct address. Blockchain transactions cannot be reversed!
                  </p>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <strong>🔒 Security Note:</strong> Never share your recovery phrase with anyone. 
                    MetaMask support will never ask for it. Store it somewhere safe and offline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="bg-brand-navy rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">3</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Connect MetaMask and Set Up Your Subscription
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Now you're ready to set up your automated rent payment:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Come back to this website and click <strong>"Connect Wallet"</strong> in the top right</li>
                  <li>Select <strong>MetaMask</strong> from the wallet options</li>
                  <li>A MetaMask popup will appear – click <strong>"Connect"</strong> to authorize</li>
                  <li>Go to <strong>"Set Up Recurring Payment"</strong></li>
                  <li>Enter your landlord's wallet address (they should provide this)</li>
                  <li>Enter your monthly rent amount in PYUSD</li>
                  <li>Select the payment date (e.g., 1st of each month)</li>
                  <li>Review the details carefully</li>
                  <li>Click <strong>"Create Subscription"</strong></li>
                  <li>MetaMask will ask you to sign the transaction – review and confirm</li>
                  <li>Wait for the blockchain transaction to confirm (1-2 minutes)</li>
                </ol>

                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm">
                    <strong>✅ That's it!</strong> Your rent will now be paid automatically each month. 
                    You'll be able to see all your payment history on the "My Subscriptions" page.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm">
                    <strong>💎 What is "signing"?</strong> When MetaMask asks you to "sign," you're 
                    cryptographically authorizing an action using your private key. It's like a digital 
                    signature that proves you own the wallet and approve the transaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-brand-navy mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              What if I don't have enough PYUSD in my wallet when rent is due?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              The automated payment will simply fail – no funds will be withdrawn. You'll need to add 
              more PYUSD to your wallet and manually process the payment or wait until the next scheduled 
              payment attempt. Make sure to keep enough balance to cover rent plus a small buffer for 
              network fees.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              Can I cancel my subscription if I move out?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Absolutely! You can cancel your subscription anytime from the "My Subscriptions" page. 
              Simply click "Cancel" and confirm the transaction in MetaMask. The cancellation takes 
              effect immediately.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              What are the fees?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              There are minimal Ethereum network fees (called "gas fees") for blockchain transactions, 
              typically $2-10 depending on network congestion. PayPal may also charge a small fee when 
              converting USD to PYUSD or transferring to an external wallet. There are no additional 
              fees from our subscription service.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              Is this safe? What if I lose access to my wallet?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Self-custody wallets like MetaMask are secure as long as you protect your recovery phrase. 
              NEVER share your recovery phrase with anyone. If you lose access to your wallet and don't 
              have your recovery phrase, your funds cannot be recovered – this is the tradeoff of 
              self-custody. Store your recovery phrase safely offline, consider using a hardware wallet 
              for large amounts, and start with small amounts while you learn.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              My landlord doesn't know about digital currency. Can they still receive payments?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Yes! Your landlord will need to set up a basic MetaMask wallet (5 minutes) to receive 
              payments. Once they receive PYUSD, they can easily transfer it back to PayPal and convert 
              to regular USD with minimal fees. Share this guide with them – we have a section for 
              property owners too!
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              What networks does PYUSD work on?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              PYUSD is available on Ethereum mainnet and Solana. This platform currently uses Ethereum 
              mainnet. Make sure when transferring from PayPal that you select the correct network 
              (Ethereum/ERC-20).
            </p>
          </details>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-brand-sage to-brand-sage-dark rounded-2xl p-10 shadow-strong text-white text-center mb-12">
        <h3 className="text-3xl font-bold mb-4">
          Ready to Set Up Automated Rent Payments?
        </h3>
        <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
          Join the future of rent payments. Set it up once, never worry about missing rent again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/create')}
            className="bg-white text-brand-sage hover:bg-gray-50 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-medium hover:shadow-strong inline-flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/for-property-owners')}
            className="bg-brand-teal text-white hover:bg-brand-teal/90 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-medium hover:shadow-strong inline-flex items-center gap-2"
          >
            Landlord Resources
          </button>
        </div>
      </div>

      {/* Back to Home */}
      <div className="text-center">
        <button
          onClick={() => navigate('/')}
          className="text-brand-teal hover:text-brand-teal/80 font-semibold inline-flex items-center gap-2"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

