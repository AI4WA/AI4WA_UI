import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';

// Helper function to get the auth token
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken');
    }
    return null;
};

// HTTP Link for queries and mutations
const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql',
});

// Auth Link for adding the JWT token to HTTP requests
const authLink = setContext((_, { headers }) => {
    const token = getAuthToken();
    return {
        headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : '',
        },
    };
});

// Combine HTTP Link with Auth Link
const httpAuthLink = authLink.concat(httpLink);

// WebSocket Link for subscriptions
const wsLink = typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
            url: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || 'ws://localhost:8080/v1/graphql',
            connectionParams: () => {
                const token = getAuthToken();
                return {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                };
            },
        })
    )
    : null;

// Split links based on operation type
const splitLink = typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
            );
        },
        wsLink,
        httpAuthLink  // Use the authenticated HTTP link
    )
    : httpAuthLink;

export const createApolloClient = () => {
    return new ApolloClient({
        link: splitLink,
        cache: new InMemoryCache(),
        defaultOptions: {
            watchQuery: {
                fetchPolicy: 'no-cache',
                errorPolicy: 'all',
            },
            query: {
                fetchPolicy: 'no-cache',
                errorPolicy: 'all',
            },
        },
    });
};