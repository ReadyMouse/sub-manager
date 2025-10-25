import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/index.js';
import { ENVIO_GRAPHQL_ENDPOINT } from './constants';

// Custom fetch function that ensures APQ extensions are never sent
// This is necessary because Envio doesn't support Automatic Persisted Queries
const customFetch = (uri: RequestInfo | URL, options: RequestInit = {}) => {
  // If there's a body, parse it and remove any APQ-related fields
  if (options.body && typeof options.body === 'string') {
    try {
      const body = JSON.parse(options.body);
      // Remove persisted query extensions if present
      if (body.extensions) {
        delete body.extensions.persistedQuery;
        if (Object.keys(body.extensions).length === 0) {
          delete body.extensions;
        }
      }
      options.body = JSON.stringify(body);
    } catch (e) {
      // If parsing fails, continue with original body
    }
  }
  
  return fetch(uri, options);
};

// Create HTTP link for Envio GraphQL endpoint
// Note: Disable automatic persisted queries (APQ) as Envio indexer doesn't support them
const httpLink = new HttpLink({
  uri: ENVIO_GRAPHQL_ENDPOINT,
  fetch: customFetch,
  fetchOptions: {
    method: 'POST',
  },
  // Disable automatic persisted queries
  useGETForQueries: false,
});

// Create Apollo Client for Envio indexer queries
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Subscription: {
        keyFields: ['id'],
      },
      Payment: {
        keyFields: ['id'],
      },
      User: {
        keyFields: ['address'],
      },
      ServiceProvider: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
  // Explicitly disable automatic persisted queries in context
  defaultContext: {
    fetchOptions: {
      method: 'POST',
    },
  },
  // Additional safeguard: explicitly set queryDeduplication
  queryDeduplication: false,
});

// Helper function to handle GraphQL errors
export const handleGraphQLError = (error: any) => {
  console.error('GraphQL Error:', error);
  
  if (error.networkError) {
    return 'Network error: Unable to connect to indexer';
  }
  
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return error.graphQLErrors[0].message;
  }
  
  return 'An unknown error occurred';
};

