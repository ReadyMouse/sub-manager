import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { SkeletonList } from '../components/Skeleton';
import { formatPYUSD, formatDateTime } from '../lib/utils';
import { apolloClient } from '../lib/apollo';
import { gql } from '@apollo/client/index.js';

export const EnvioAdmin: React.FC = () => {
  const { isConnected } = useAccount();
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query to get all events from the contract
  const ALL_EVENTS_QUERY = gql`
    query GetAllEvents {
      stableRentSubscription_SubscriptionCreateds(orderBy: timestamp, orderDirection: desc, first: 100) {
        id
        subscriptionId
        senderAddress
        recipientId
        amount
        serviceName
        timestamp
      }
      stableRentSubscription_PaymentProcesseds(orderBy: timestamp, orderDirection: desc, first: 100) {
        id
        subscriptionId
        senderAddress
        amount
        processorFee
        paymentCount
        timestamp
      }
      stableRentSubscription_SubscriptionCancelleds(orderBy: timestamp, orderDirection: desc, first: 100) {
        id
        subscriptionId
        senderAddress
        timestamp
        reason
      }
      stableRentSubscription_PaymentFaileds(orderBy: timestamp, orderDirection: desc, first: 100) {
        id
        subscriptionId
        senderAddress
        amount
        timestamp
        reason
        failedCount
      }
    }
  `;

  useEffect(() => {
    const fetchAllEvents = async () => {
      setEventsLoading(true);
      setError(null);
      try {
        const result = await apolloClient.query({
          query: ALL_EVENTS_QUERY,
        });

        const data = result.data as any;
        
        // Add null check for data
        if (!data) {
          const errorMsg = 'No data returned from Envio indexer. Please check that the indexer is running and connected.';
          console.error('Error fetching events:', errorMsg);
          setError(errorMsg);
          setAllEvents([]);
          return;
        }
        
        // Combine all events and add event type
        const events = [
          ...(data.stableRentSubscription_SubscriptionCreateds || []).map((e: any) => ({ ...e, eventType: 'SubscriptionCreated' })),
          ...(data.stableRentSubscription_PaymentProcesseds || []).map((e: any) => ({ ...e, eventType: 'PaymentProcessed' })),
          ...(data.stableRentSubscription_SubscriptionCancelleds || []).map((e: any) => ({ ...e, eventType: 'SubscriptionCancelled' })),
          ...(data.stableRentSubscription_PaymentFaileds || []).map((e: any) => ({ ...e, eventType: 'PaymentFailed' })),
        ];

        // Sort all events by timestamp
        events.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
        
        setAllEvents(events);
      } catch (err: any) {
        const errorMsg = err.networkError 
          ? 'Network error: Unable to connect to Envio indexer. Please check that the indexer is running.'
          : err.message || 'An error occurred while fetching events';
        console.error('Error fetching events:', err);
        setError(errorMsg);
        setAllEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    if (isConnected) {
      fetchAllEvents();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-brand-navy mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Connect your wallet to access the Envio Admin panel
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-navy mb-2">Envio Admin - All Contract Events</h1>
        <p className="text-gray-600">
          Debug panel showing all events from the StableRentSubscription contract indexed by Envio
        </p>
      </div>

      {/* Summary Card */}
      {!eventsLoading && allEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Total Events</div>
            <div className="text-3xl font-bold text-brand-navy">{allEvents.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Subscriptions Created</div>
            <div className="text-3xl font-bold text-green-600">
              {allEvents.filter(e => e.eventType === 'SubscriptionCreated').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Payments Processed</div>
            <div className="text-3xl font-bold text-blue-600">
              {allEvents.filter(e => e.eventType === 'PaymentProcessed').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Cancellations</div>
            <div className="text-3xl font-bold text-red-600">
              {allEvents.filter(e => e.eventType === 'SubscriptionCancelled').length}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Envio Indexer Not Available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">{error}</p>
                <details className="mt-3">
                  <summary className="cursor-pointer font-medium hover:text-yellow-800">How to fix this</summary>
                  <div className="mt-2 space-y-2 pl-4">
                    <p><strong>For local development:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Navigate to the <code className="bg-yellow-100 px-1 rounded">envio/</code> directory</li>
                      <li>Run <code className="bg-yellow-100 px-1 rounded">pnpm dev</code> to start the local indexer</li>
                      <li>The indexer will be available at <code className="bg-yellow-100 px-1 rounded">http://localhost:8080/graphql</code></li>
                    </ol>
                    <p className="mt-3"><strong>For production:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Deploy the indexer to Envio's hosted service (see <a href="https://docs.envio.dev" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">Envio docs</a>)</li>
                      <li>Set the <code className="bg-yellow-100 px-1 rounded">VITE_ENVIO_ENDPOINT</code> environment variable in your frontend deployment</li>
                    </ol>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Events */}
      {eventsLoading ? (
        <SkeletonList count={5} />
      ) : allEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-navy mb-2">
            No Events Found
          </h2>
          <p className="text-gray-600">
            No events have been indexed by Envio yet for this contract
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.eventType === 'SubscriptionCreated' 
                          ? 'bg-green-100 text-green-800'
                          : event.eventType === 'PaymentProcessed'
                          ? 'bg-blue-100 text-blue-800'
                          : event.eventType === 'SubscriptionCancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {event.subscriptionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-mono text-xs">
                        {event.senderAddress.slice(0, 6)}...{event.senderAddress.slice(-4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {event.eventType === 'SubscriptionCreated' && (
                        <div>
                          <div className="font-medium">{event.serviceName}</div>
                          <div className="text-xs text-gray-500">{formatPYUSD(BigInt(event.amount))} PYUSD</div>
                        </div>
                      )}
                      {event.eventType === 'PaymentProcessed' && (
                        <div>
                          <div className="font-medium">Payment #{event.paymentCount}</div>
                          <div className="text-xs text-gray-500">{formatPYUSD(BigInt(event.amount))} PYUSD</div>
                        </div>
                      )}
                      {event.eventType === 'SubscriptionCancelled' && (
                        <div className="text-xs text-gray-500">{event.reason || 'No reason provided'}</div>
                      )}
                      {event.eventType === 'PaymentFailed' && (
                        <div>
                          <div className="font-medium text-red-600">Failed (Attempt #{event.failedCount})</div>
                          <div className="text-xs text-gray-500">{event.reason}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(parseInt(event.timestamp))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
