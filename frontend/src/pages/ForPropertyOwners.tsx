import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Database, Wallet, ArrowRight, DollarSign, TrendingUp, Users, FileCheck } from 'lucide-react';

export const ForPropertyOwners: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-sage to-brand-sage-dark rounded-2xl p-12 mb-12 shadow-strong text-white">
        <h1 className="text-5xl font-bold mb-4">
          Accept Rent Payments in Digital Currency
        </h1>
        <p className="text-xl text-white/90 mb-6">
          Join the future of property management. Learn why forward-thinking property owners are 
          accepting stablecoin payments and how blockchain technology benefits property owners.
        </p>
      </div>

      {/* Overview Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-brand-navy mb-6">
          Why Accept Stablecoins for Rent?
        </h2>
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-brand-sage/10 rounded-lg p-3">
              <TrendingUp className="w-8 h-8 text-brand-sage" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-navy mb-2">
                The Digital Currency Landscape
              </h3>
              <p className="text-gray-700 leading-relaxed">
                The digital currency market has matured into a <strong>multi-trillion dollar global ecosystem</strong>, 
                with institutional adoption from major companies like PayPal, Visa, and traditional banks. 
                Stablecoins like PYUSD (PayPal USD) represent the perfect intersection of traditional finance 
                and blockchain innovation, offering <strong>price stability</strong> while leveraging the benefits 
                of decentralized technology.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-brand-sage/5 rounded-lg p-6 border border-brand-sage/20">
              <div className="text-3xl mb-3">🏦</div>
              <h4 className="font-bold text-brand-navy mb-2">Mainstream Adoption</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Major financial institutions and Fortune 500 companies are integrating stablecoins 
                into their payment infrastructure. You're not early adopting experimental technology – 
                you're joining an established financial ecosystem.
              </p>
            </div>
            <div className="bg-brand-teal/5 rounded-lg p-6 border border-brand-teal/20">
              <div className="text-3xl mb-3">💵</div>
              <h4 className="font-bold text-brand-navy mb-2">1:1 USD Peg</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                PYUSD maintains a stable $1.00 value, backed by PayPal's reserves. Unlike Bitcoin 
                or Ethereum, your rent amount won't fluctuate – $1,500 in PYUSD equals $1,500 in USD.
              </p>
            </div>
            <div className="bg-brand-navy/5 rounded-lg p-6 border border-brand-navy/20">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-bold text-brand-navy mb-2">Instant Settlement</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Receive rent payments directly to your wallet within minutes, not the 3-5 business 
                days of traditional bank transfers. No waiting for checks to clear.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="text-3xl mb-3">🛡️</div>
              <h4 className="font-bold text-brand-navy mb-2">No Chargebacks</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Unlike credit cards or PayPal payments, blockchain transactions are final and 
                irreversible. Once you receive rent, it cannot be disputed or charged back.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Benefits for Property Owners */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-brand-navy mb-6">
          Blockchain Benefits for Property Owners
        </h2>

        {/* Tenant Vetting - Public Balances */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-sage/10 rounded-lg p-3">
              <Users className="w-8 h-8 text-brand-sage" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Better Tenant Screening: Public Account Balances
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Blockchain technology provides transparency that benefits property owners during the 
                tenant screening process. All wallet balances are publicly viewable on the blockchain:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Instant Financial Verification:</strong> Potential tenants can prove they 
                    have sufficient funds without sharing sensitive bank statements or credit reports
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Real-Time Proof of Funds:</strong> See wallet balances instantly rather than 
                    waiting days for bank verification letters or employer confirmations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Reduce Application Fraud:</strong> Blockchain balances can't be faked with 
                    photoshopped bank statements or forged documents
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Privacy Preserved:</strong> Tenants share financial capacity without revealing 
                    employer information, SSN, or other sensitive personal data
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Streamline Applications:</strong> Reduce paperwork and speed up the rental 
                    application process for qualified tenants
                  </span>
                </li>
              </ul>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>💡 How it works:</strong> A prospective tenant can share their wallet address 
                  with you. You can view their balance on blockchain explorers like Etherscan.io to verify 
                  they have sufficient funds – all without accessing their personal information or bank accounts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Vetting - Payment History */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-teal/10 rounded-lg p-3">
              <FileCheck className="w-8 h-8 text-brand-teal" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Superior Tenant Screening: Permanent Payment Records
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Blockchain transactions are permanent and immutable. This creates an unprecedented 
                level of transparency for property owner-tenant relationships:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Complete Payment History:</strong> See a tenant's entire rent payment history 
                    from previous addresses if they paid via blockchain
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Verify On-Time Payment Track Record:</strong> Timestamps prove whether tenants 
                    consistently paid rent on time or were frequently late
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Eliminate Property Owner Reference Fraud:</strong> Some tenants provide fake references. 
                    Blockchain records can't be fabricated or altered
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Build Tenant Credit Profiles:</strong> Help good tenants build verifiable payment 
                    histories, creating incentives for responsible behavior
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Protect Yourself from Bad Tenants:</strong> Identify applicants with histories 
                    of late payments, evictions, or payment disputes before signing a lease
                  </span>
                </li>
              </ul>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>🔍 Example:</strong> A tenant applies to your property claiming they've always paid 
                  rent on time. With their wallet address, you can verify their complete payment history on 
                  the blockchain – seeing exact dates, amounts, and recipient addresses. No need to call 
                  previous property owners or rely on potentially biased references.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Automated Rent Collection */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="bg-brand-navy/10 rounded-lg p-3">
              <Shield className="w-8 h-8 text-brand-navy" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Automated, Guaranteed Rent Collection
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Smart contract subscriptions ensure you receive rent automatically and on time:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>No More Chasing Payments:</strong> Rent is automatically collected on the 
                    agreed date – no reminders, follow-ups, or awkward conversations needed
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Instant Receipts:</strong> Every payment is automatically documented on the 
                    blockchain with timestamps and transaction IDs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Reduced Late Payments:</strong> Automated systems mean tenants can't "forget" 
                    to pay rent, reducing late payment issues
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Lower Collection Costs:</strong> No property management fees for rent collection, 
                    no bounced check fees, no credit card processing charges
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
          Getting Started as a Property Owner
        </h2>

        {/* Step 1 */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-sage rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">1</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Set Up a Wallet to Receive Payments
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  You'll need a digital wallet to receive PYUSD payments. MetaMask is the most popular 
                  and user-friendly option:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Visit <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">metamask.io</a> and install the browser extension</li>
                  <li>Click "Create a new wallet"</li>
                  <li>Create a strong password for the extension</li>
                  <li>MetaMask will show you a <strong>12-word recovery phrase</strong></li>
                  <li><strong className="text-red-600">CRITICAL:</strong> Write down this phrase on paper and store it somewhere safe. Never share it with anyone!</li>
                  <li>Confirm your recovery phrase by selecting the words in order</li>
                  <li>Your wallet is now ready! Click on the account name to copy your wallet address</li>
                </ol>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm">
                    <strong>⚠️ Security Warning:</strong> Your recovery phrase is like a master key to your 
                    funds. Anyone who has it can access your wallet. MetaMask will never ask for it. Keep it 
                    offline and secure. Consider using a hardware wallet like Ledger for larger amounts.
                  </p>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <strong>💼 For Multiple Properties:</strong> You can create separate wallet addresses 
                    for each property, or use one wallet for all rent payments. MetaMask allows you to 
                    manage multiple accounts easily.
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
                Share Your Wallet Address with Tenants
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Once you have your wallet set up, provide your wallet address to your tenant:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Open MetaMask and click on your account name at the top to copy your address</li>
                  <li>Your address will look like: <code className="bg-gray-100 px-2 py-1 rounded text-sm">0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</code></li>
                  <li>Share this address with your tenant via email, text, or lease agreement</li>
                  <li>Direct them to this website to set up their automated subscription</li>
                </ol>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm">
                    <strong>💡 Pro Tip:</strong> Your wallet address is public and safe to share. It's like 
                    sharing your email address – people need it to send you payments, and it doesn't give 
                    them access to your funds.
                  </p>
                </div>
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm">
                    <strong>📄 Lease Agreement:</strong> Include your wallet address in the lease agreement 
                    along with traditional payment methods. Specify rent amount, due date, and that payments 
                    will be made in PYUSD via blockchain subscription.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-navy rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">3</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Receive Rent Payments Automatically
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Once your tenant sets up their subscription, rent payments arrive automatically:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-sage">•</span>
                    <span>Payments arrive on the scheduled date each month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-sage">•</span>
                    <span>You'll see the PYUSD balance increase in your MetaMask wallet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-sage">•</span>
                    <span>MetaMask can send you browser notifications when payments arrive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-sage">•</span>
                    <span>View complete payment history on blockchain explorers like Etherscan.io</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <strong>🔔 Stay Notified:</strong> Enable MetaMask notifications in your browser settings 
                    to receive real-time alerts when rent payments arrive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-xl p-8 shadow-medium border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="bg-purple-600 rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">4</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy mb-3">
                Convert PYUSD to USD in PayPal
              </h3>
              <div className="space-y-3 text-gray-700">
                <p className="leading-relaxed">
                  Ready to convert your PYUSD rent payments back to regular USD? PayPal makes it simple:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-bold mb-2">Transfer PYUSD from MetaMask to PayPal:</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Open your PayPal app and go to <strong>Crypto</strong></li>
                    <li>Select <strong>PYUSD</strong></li>
                    <li>Tap <strong>"Receive"</strong> to get your PayPal wallet address</li>
                    <li>Copy this address</li>
                    <li>Open MetaMask browser extension</li>
                    <li>Click <strong>"Send"</strong></li>
                    <li>Paste your PayPal wallet address</li>
                    <li>Enter the amount of PYUSD you want to transfer</li>
                    <li>Review the small network fee (typically $2-10)</li>
                    <li>Confirm the transaction</li>
                    <li>Wait 3-10 minutes for the transfer to complete</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Convert PYUSD to USD in PayPal:</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Once PYUSD arrives in your PayPal account, go to <strong>Crypto → PYUSD</strong></li>
                    <li>Tap <strong>"Sell"</strong> or <strong>"Convert to USD"</strong></li>
                    <li>Enter the amount you want to convert</li>
                    <li>Review the conversion rate (should be 1:1 with minimal fees)</li>
                    <li>Confirm the conversion</li>
                    <li>USD is now in your PayPal balance</li>
                    <li>Transfer to your linked bank account as usual</li>
                  </ol>
                </div>

                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm">
                    <strong>💰 Fee Structure:</strong> PayPal charges minimal fees for PYUSD conversion 
                    (typically less than 1%). Network fees for transferring from MetaMask to PayPal are 
                    variable but usually $2-10 depending on Ethereum network congestion. These costs are 
                    often offset by the benefits of automated collection and reduced administrative overhead.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm">
                    <strong>⚠️ Test First:</strong> When transferring PYUSD for the first time, send a small 
                    test amount (like $10) to make sure you have the correct PayPal wallet address. Blockchain 
                    transactions are irreversible!
                  </p>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <strong>📊 Alternative:</strong> You don't have to convert immediately. Some property owners 
                    keep PYUSD in their wallet and only convert when needed. Others convert monthly after 
                    rent collection. Choose what works best for your financial management.
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
              What happens if a tenant doesn't have enough PYUSD when rent is due?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              The automated payment will fail, and no funds will be withdrawn. You'll be notified that 
              the payment didn't go through. This is similar to a bounced check. The tenant would then 
              need to add funds and process a manual payment, or the system will attempt again at the 
              next scheduled interval. Late payment terms from your lease agreement would apply.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              What are the tax implications of receiving rent in digital currency?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              From a tax perspective, receiving PYUSD as rent is treated the same as receiving USD rent – 
              it's rental income. Since PYUSD is pegged 1:1 to the dollar, there are no capital gains 
              considerations (unlike receiving Bitcoin or Ethereum). Report the rental income at its USD 
              value on your tax return as you normally would. Consult with a tax professional familiar 
              with digital currency for your specific situation.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              Is this legal and compliant with rental laws?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Yes. Accepting digital currency as rent is legal in most jurisdictions. However, you should 
              still follow all local property owner-tenant laws, provide proper receipts, maintain records, and 
              include payment terms in your lease agreement. Some states or localities may have specific 
              requirements, so check your local regulations. The blockchain transaction history serves as 
              an excellent record-keeping system that exceeds most legal requirements.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              What about security? Can hackers steal my rent payments?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Your funds are as secure as your wallet's recovery phrase. As long as you keep your recovery 
              phrase private and secure (written down offline, never shared, never entered on suspicious 
              websites), your funds are extremely safe. The blockchain itself is highly secure. For large 
              amounts, consider using a hardware wallet like Ledger or Trezor, which stores your keys 
              offline. Transfer funds to PayPal regularly if you're more comfortable with traditional 
              custodial security.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              Can I still accept traditional payment methods alongside PYUSD?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Absolutely! Many property owners offer PYUSD as an optional payment method alongside checks, ACH 
              transfers, or traditional online payments. This gives tech-savvy tenants an innovative option 
              while keeping traditional methods available. Some property owners even offer a small discount 
              (like $25/month) for tenants who pay via PYUSD to offset the time saved on payment processing.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              How do I provide rent receipts to tenants?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Every blockchain transaction has a unique transaction ID (hash) that serves as an immutable 
              receipt. You can provide this to tenants along with a link to view it on Etherscan.io. You 
              can also generate traditional rent receipts using property management software and reference 
              the blockchain transaction ID for verification. The blockchain record is actually superior 
              to paper receipts since it can't be lost, forged, or disputed.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              What if PYUSD loses its $1 peg or PayPal shuts it down?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              PYUSD is backed by PayPal's reserves and regulated as a stablecoin, making a depeg unlikely. 
              However, stablecoins have regulatory oversight and PayPal has significant reputation at stake. 
              If you're concerned, you can transfer PYUSD to PayPal and convert to USD immediately upon 
              receiving each rent payment. This minimizes any theoretical exposure to stablecoin risk while 
              still benefiting from blockchain automation and transparency.
            </p>
          </details>

          <details className="bg-white rounded-xl p-6 shadow-medium border border-gray-100">
            <summary className="font-bold text-brand-navy cursor-pointer text-lg">
              How do I explain this to my accountant or property manager?
            </summary>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Explain that you're receiving rent in PYUSD (PayPal USD), a digital dollar that's 1:1 with 
              USD. The payments are automated, arrive on-time, and have complete blockchain records. You 
              can easily convert PYUSD to regular USD in PayPal. For accounting purposes, treat it as cash 
              rent received – the amount in PYUSD equals the USD amount. Provide them with transaction 
              history from Etherscan.io and your PayPal conversion records. Most modern accountants are 
              familiar with digital currency basics.
            </p>
          </details>
        </div>
      </section>

      {/* Benefits Summary */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-brand-sage/10 to-brand-teal/10 rounded-xl p-8 border border-brand-sage/30">
          <h2 className="text-2xl font-bold text-brand-navy mb-6 text-center">
            Why Forward-Thinking Property Owners Choose Blockchain Rent
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">Automated, on-time payments every month</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">Verify tenant financial capacity instantly</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">View complete payment history from previous rentals</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">No chargebacks or payment reversals</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">Permanent, tamper-proof payment records</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">Easy conversion to USD through PayPal</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">Lower collection costs and admin overhead</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-sage rounded w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">Attract tech-savvy, financially responsible tenants</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-navy rounded-2xl p-10 shadow-strong text-white text-center mb-12">
        <h3 className="text-3xl font-bold mb-4">
          Ready to Accept Digital Currency Rent?
        </h3>
        <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
          Share this platform with your tenants and start receiving automated, on-time rent payments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/create')}
            className="bg-white text-brand-teal hover:bg-gray-50 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-medium hover:shadow-strong inline-flex items-center gap-2"
          >
            View Platform Demo
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/for-residents')}
            className="bg-brand-sage text-white hover:bg-brand-sage-dark font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-medium hover:shadow-strong inline-flex items-center gap-2"
          >
            Tenant Resources
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

