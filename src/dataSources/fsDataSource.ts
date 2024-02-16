import { dataSource, Element } from "@prismatic-io/spectral";
import { fsConnectionInput, fundIdInput } from "../inputs";
import { GraphQLClient } from "graphql-request";
import { GET_FUND_SUBSCRIPTIONS_QUERY } from "../actions/queries";
import { createGraphQLClient } from "../client";
import { DataTemplate, getFundInfoAPI } from "../actions/utils";

interface FundSubscriptionInfo {
  id: string;
  customFundId: string;
  name: string;
  currency: string;
  supportingDocReviewEnabled: boolean;
  createdAt: string;
  inactiveNotificationEnabled: boolean;
  inactiveNotificationDuration: number;
  lastUpdatedAt: string;
}

interface FundSubscriptionQueryResult {
  queryFundSubscription: FundSubscriptionInfo[];
}

export const queryAllFundSubscriptions = async (
  graphqlClient: GraphQLClient,
  first = 10, // Adjust the batch size as needed
  offset = 0,
  aggregatedResult: FundSubscriptionInfo[] = [],
): Promise<FundSubscriptionInfo[]> => {
  const result = await graphqlClient.request<FundSubscriptionQueryResult>(
    GET_FUND_SUBSCRIPTIONS_QUERY,
    { first, offset },
  );

  const combinedResult = [...aggregatedResult, ...result.queryFundSubscription];

  if (result.queryFundSubscription.length < first) {
    // No more items to fetch
    return combinedResult;
  }

  // Fetch next batch
  return queryAllFundSubscriptions(
    graphqlClient,
    first,
    offset + first,
    combinedResult,
  );
};

export const selectFund = dataSource({
  display: {
    label: "Select Fund Engagement",
    description: "Select a Fund Engagement for the integration",
  },
  inputs: {
    anduinFsConnection: fsConnectionInput,
  },
  perform: async (context, { anduinFsConnection: connection }) => {
    const graphqlClient = createGraphQLClient(connection);
    const queryResult = await queryAllFundSubscriptions(graphqlClient);
    const result = queryResult.map<Element>((fundInfo) => ({
      label: fundInfo.name,
      key: fundInfo.id,
    }));

    return { result };
  },
  dataSourceType: "picklist",
});

export const defaultTemplate: Element = {
  label: "Anduin standard fields",
  key: "default_template",
};

const dataTemplateToElements = (templates: DataTemplate[]): Element[] => {
  const elements = templates.map<Element>((template) => ({
    label: `${template.name} (type: ${template.templateType})`,
    key: template.id,
  }));

  return elements;
};

export const selectTemplate = dataSource({
  display: {
    label: "Select a template of a Fund",
    description: "Select a data mapping template of the selected fund",
  },
  inputs: {
    anduinFsConnection: fsConnectionInput,
    fundId: fundIdInput,
  },
  perform: async (context, { anduinFsConnection, fundId }) => {
    const fundInfo = await getFundInfoAPI(anduinFsConnection, fundId);
    const templates = fundInfo.templates;

    const customTemplate = templates ? dataTemplateToElements(templates) : [];

    const result = [...[defaultTemplate], ...customTemplate];
    return { result };
  },
  dataSourceType: "picklist",
});
