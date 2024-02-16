import { Connection, ConnectionError, util } from "@prismatic-io/spectral";
import { GraphQLClient } from "graphql-request";
import {
  HttpClient,
  createClient as createHttpClient,
} from "@prismatic-io/spectral/dist/clients/http";
import { apiKeyAuth } from "./connections";

const toAuthorizationHeaders = (
  connection: Connection,
): { Authorization: string } => {
  const accessToken = util.types.toString(connection.token?.access_token);
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }

  const apiKey = util.types.toString(connection.fields?.apiKey);
  if (apiKey) {
    return { Authorization: `Bearer ${apiKey}` };
  }

  const username = util.types.toString(connection.fields?.username);
  const password = util.types.toString(connection.fields?.password);
  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }

  throw new Error(
    `Failed to guess at authorization parameters for Connection: ${connection.key}`,
  );
};

export const createFSClient = (connection: Connection): HttpClient => {
  if (![apiKeyAuth.key].includes(connection.key)) {
    throw new ConnectionError(
      connection,
      `Authentication key not defined: ${connection.key}`,
    );
  }
  const baseUrl = util.types.toString(connection.fields?.environment);

  const client = createHttpClient({
    baseUrl,
    headers: {
      ...toAuthorizationHeaders(connection),
      Accept: "application/json",
    },
    responseType: "json",
    // debug: true,
  });
  return client;
};

export const createGraphQLClient = (connection: Connection): GraphQLClient => {
  if (![apiKeyAuth.key].includes(connection.key)) {
    throw new ConnectionError(
      connection,
      `Authentication key not defined: ${connection.key}`,
    );
  }
  const baseUrl = util.types.toString(connection.fields?.environment);
  const graphqlEndpoint = `${baseUrl}/graphql`;

  const client = new GraphQLClient(graphqlEndpoint, {
    headers: {
      ...toAuthorizationHeaders(connection),
      Accept: "application/json",
    },
  });
  return client;
};
