import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client/index.js';
import { ENVIO_GRAPHQL_ENDPOINT } from './constants';

// Create HTTP link for Envio GraphQL endpoint
const httpLink = new HttpLink({
  uri: ENVIO_GRAPHQL_ENDPOINT,
});

// Create Apollo Client for Envio indexer queries
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([httpLink]),
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

