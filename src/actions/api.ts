import { action, input, util } from "@prismatic-io/spectral";
import { createFSClient } from "../client";
import { getOrderStatus, getOrderDocuments } from "./wrap-graphql";
import { fundSubWebhookEventOptions, orderTypeOptions } from "../util";
import {
  fsConnectionInput,
  fundIdInput,
  orderIdInput,
  templateIdInput,
} from "../inputs";
import { getFundInfoAPI, getStandardFormFieldsAPI } from "./utils";

const getFundInfo = action({
  display: {
    label: "Get Fund Info",
    description: "Get Fund Information",
  },
  perform: async (_context, { connection, fundId }) => {
    const fundInfo = await getFundInfoAPI(connection, fundId);
    return { data: fundInfo };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
  },
  examplePayload: {
    data: {
      id: "txn0000000000000.fsb0000",
      customId: "Fund123",
      name: "ABC UAT Fund",
      membersGroups: [
        {
          id: "txn0000000000000.ttm000000",
          name: "Group name",
          members: [
            {
              email: "john.doe@gmail.com",
              firstName: "John",
              lastName: "Doe",
            },
          ],
        },
      ],
      closes: [
        {
          id: "txn0000000000000.fsb0000.fsc0000000",
          name: "Close name",
          targetDate: "04/20/2024",
        },
      ],
      templates: [
        {
          id: "dtp00000000000000000.dtv0000000",
          name: "Template name",
          templateType: "EXPORT",
          fields: ["class", "amount", "investorType"],
        },
      ],
      orderIds: ["txn0000000000000.fsb0000.lpp0000000"],
    },
  },
});

const updateClose = action({
  display: {
    label: "Update Close",
    description: "Update a Close",
  },
  perform: async (
    context,
    { connection, closeId, name, customId, targetDate },
  ) => {
    const client = createFSClient(connection);
    const { data } = await client.post(`/api/v1/fundsub/closes/${closeId}`, {
      name,
      customId,
      targetDate,
    });
    return { data };
  },
  inputs: {
    connection: input({
      label: "Connection",
      type: "connection",
      required: true,
    }),
    closeId: input({
      label: "Close Id",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The unique ID of the Close object",
    }),
    name: input({
      label: "Name",
      type: "string",
      required: false,
      example: "Close 2",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
    }),
    customId: input({
      label: "Custom Id",
      type: "string",
      required: false,
      example: "Close123",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "Custom ID assigned by user to the Close",
    }),
    targetDate: input({
      label: "Target Date",
      type: "string",
      required: false,
      example: "04/20/2024",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "Date string in MM/dd/yyyy format",
    }),
  },
  examplePayload: {
    data: {
      name: "Close 2",
      customId: "Close123",
      targetDate: "04/20/2024",
    },
  },
});

const inviteInvestor = action({
  display: {
    label: "Invite Investor",
    description: "Create a New Order",
  },
  perform: async (
    context,
    { connection, fundId, orderType, closeId, order, templateId },
  ) => {
    const client = createFSClient(connection);
    const { data } = await client.post(`/api/v1/fundsub/${fundId}/orders`, {
      orderType,
      closeId,
      order,
      templateId,
    });
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
    orderType: input({
      label: "Order Type",
      type: "string",
      required: false,
      default: "0",
      model: orderTypeOptions,
      clean: (value): number => util.types.toNumber(value),
      comments:
        "The type of the order, which is used to determine whether to invite the order contacts or not",
    }),
    closeId: input({
      label: "Close Id",
      type: "string",
      required: false,
      example: "txn0000000000000.fsb0000.fsc0000000",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The Id of the close to associate with the order",
    }),
    order: input({
      label: "Order",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "Parameters to create orders",
    }),
    templateId: templateIdInput,
  },
  examplePayload: {
    data: {
      orderId: "txn0000000000000.fsb0000.lpp0000000",
      warnings: [
        {
          fields: ["string"],
          warning: "string",
        },
      ],
    },
  },
});

const bulkInviteInvestor = action({
  display: {
    label: "Bulk Invite Investor",
    description: "Create Multiple Orders",
  },
  perform: async (
    context,
    { connection, fundId, orderType, closeId, orders, templateId },
  ) => {
    const client = createFSClient(connection);
    const { data } = await client.post(
      `/api/v1/fundsub/${fundId}/async/bulk/orders`,
      { orderType, closeId, orders, templateId },
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
    orderType: input({
      label: "Order Type",
      type: "string",
      required: false,
      default: "0",
      model: orderTypeOptions,
      clean: (value): number => util.types.toNumber(value),
      comments:
        "The type of the order, which is used to determine whether to invite the order contacts or not",
    }),
    closeId: input({
      label: "Close Id",
      type: "string",
      required: false,
      example: "txn0000000000000.fsb0000.fsc0000000",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The Id of the close to associate with the order",
    }),
    orders: input({
      label: "Orders",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The non-empty list of parameters to create orders",
    }),
    templateId: templateIdInput,
  },
  examplePayload: {
    data: {
      requestId: "string",
    },
  },
});

const getOrdersFormData = action({
  display: {
    label: "Get Orders Form Data",
    description: "Get Form Data",
  },
  perform: async (context, { connection, fundId, orderIds, templateId }) => {
    const client = createFSClient(connection);
    const { data } = await client.post(
      `/api/v1/fundsub/${fundId}/orders/formData`,
      { orderIds, templateId },
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
    orderIds: input({
      label: "Order list",
      type: "string",
      collection: "valuelist",
      required: true,
      comments: "For each order, provide its OrderId",
    }),
    templateId: templateIdInput,
  },
  examplePayload: {
    data: {
      orders: [
        {
          orderId: "txn0000000000000.fsb0000.lpp0000000",
          formData: {
            additionalProp1: "string",
            additionalProp2: "string",
            additionalProp3: "string",
          },
        },
      ],
      responseType: "string",
    },
  },
});

const updaterOrder = action({
  display: {
    label: "Update Order",
    description: "Update Order",
  },
  perform: async (
    context,
    { connection, orderId, closeId, customId, metadata },
  ) => {
    const client = createFSClient(connection);
    const { data } = await client.post(`/api/v1/fundsub/orders/${orderId}`, {
      closeId,
      customId,
      metadata,
    });
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    orderId: orderIdInput,
    closeId: input({
      label: "Close Id",
      type: "string",
      required: true,
      example: "txn0000000000000.fsb0000.fsc0000000",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The Id of the close to associate with the order",
    }),
    customId: input({
      label: "Custom Id",
      type: "string",
      required: false,
      example: "Investor123",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "Custom ID assigned by user to the Order",
    }),
    metadata: input({
      label: "Metadata",
      type: "string",
      required: false,
      example: "[object Object]",
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "Order metadata",
    }),
  },
  examplePayload: {
    data: {
      id: "txn0000000000000.fsb0000.lpp0000000",
      closeId: "txn0000000000000.fsb0000.fsc0000000",
      customId: "Investor123",
      metadata: {
        "Opportunity Id": "ID12345",
        "Client Name": "JV VC",
      },
    },
  },
});

const activateOfflineOrder = action({
  display: {
    label: "Activate Offline Order",
    description: "Activate an Offline Order",
  },
  perform: async (context, { connection, orderId }) => {
    const client = createFSClient(connection);
    const { data } = await client.put(
      `/api/v1/fundsub/orders/${orderId}/online`,
      {},
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    orderId: orderIdInput,
  },
  examplePayload: {
    data: {
      responseType: "string",
    },
  },
});

const getFileDownloadUrl = action({
  display: {
    label: "Get File Download Url",
    description: "Get File Download URL",
  },
  perform: async (context, { connection, fileId }) => {
    const client = createFSClient(connection);
    const { data } = await client.get(`/api/v1/fundsub/files/${fileId}/url`);
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fileId: input({
      label: "File Id",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The unique ID of the File object",
    }),
  },
  examplePayload: {
    data: {
      url: "string",
      responseType: "string",
    },
  },
});

const getRequestStatus = action({
  display: {
    label: "Get Request Status",
    description: "Get Request Status",
  },
  perform: async (context, { connection, requestId }) => {
    const client = createFSClient(connection);
    const { data } = await client.get(
      `/api/v1/fundsub/requests/${requestId}/status`,
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    requestId: input({
      label: "Request Id",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The unique ID of the Request",
    }),
  },
  examplePayload: {
    data: {
      status: 0,
      result: {},
      error: "string",
    },
  },
});

const fundLink = action({
  display: {
    label: "Fund Link",
    description: "Get Invitation Link",
  },
  perform: async (context, { connection, fundId }) => {
    const client = createFSClient(connection);
    const { data } = await client.get(`/api/v1/fundsub/${fundId}/link`);
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
  },
  examplePayload: {
    data: {
      link: "string",
      responseType: "string",
    },
  },
});

const getAllFundWebhooks = action({
  display: {
    label: "Get Webhooks of a Fund",
    description: "Get detail of all webhook endpoints in a fund",
  },
  perform: async (context, { connection, fundId }) => {
    const client = createFSClient(connection);
    const { data } = await client.get(`/api/v1/fundsub/${fundId}/webhook`);
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
  },
  examplePayload: {
    data: {
      fundId: "txn0000000000000.fsb0000",
      webhooks: [
        {
          id: "txn0000000000000.fsb0000.wid000000",
          url: "string",
          isActive: true,
          fundId: "txn0000000000000.fsb0000",
          enabledEvents: ["new_investor_added"],
          responseType: "string",
        },
      ],
      responseType: "string",
    },
  },
});

const createWebhook = action({
  display: {
    label: "Create a Webhook",
    description: "Create a webhook endpoint",
  },
  perform: async (context, { connection, fundId, enabledEvents, url }) => {
    const client = createFSClient(connection);
    const { data } = await client.post(`/api/v1/fundsub/${fundId}/webhook`, {
      enabledEvents,
      url,
    });
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
    enabledEvents: input({
      label: "Webhook Event",
      type: "string",
      collection: "valuelist",
      model: fundSubWebhookEventOptions,
      required: true,
      comments: "Select the event to to subscribe for this webhook",
    }),
    url: input({
      label: "URL",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments:
        "URL to the endpoint that receives the webhook events and payloads",
    }),
  },
  examplePayload: {
    data: {
      id: "txn0000000000000.fsb0000.wid000000",
      url: "string",
      fundId: "txn0000000000000.fsb0000",
      enabledEvents: ["string"],
      responseType: "string",
    },
  },
});

const getWebhook = action({
  display: {
    label: "Get Webhook",
    description: "Get detail of a webhook endpoint",
  },
  perform: async (context, { connection, fundId, webhookEndpointId }) => {
    const client = createFSClient(connection);
    const { data } = await client.get(
      `/api/v1/fundsub/${fundId}/webhook/${webhookEndpointId}`,
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
    webhookEndpointId: input({
      label: "Webhook Endpoint Id",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The unique ID of the Webhook endpoint",
    }),
  },
  examplePayload: {
    data: {
      id: "txn0000000000000.fsb0000.wid000000",
      url: "string",
      isActive: true,
      fundId: "txn0000000000000.fsb0000",
      enabledEvents: ["new_investor_added"],
      responseType: "string",
    },
  },
});

const updateWebhook = action({
  display: {
    label: "Update Webhook",
    description: "Update a webhook endpoint",
  },
  perform: async (
    context,
    { connection, fundId, webhookEndpointId, enabledEvents, url },
  ) => {
    const client = createFSClient(connection);
    const { data } = await client.put(
      `/api/v1/fundsub/${fundId}/webhook/${webhookEndpointId}`,
      { enabledEvents, url },
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
    webhookEndpointId: input({
      label: "Webhook Endpoint Id",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The unique ID of the Webhook endpoint",
    }),
    enabledEvents: input({
      label: "Webhook Event",
      type: "string",
      collection: "valuelist",
      model: fundSubWebhookEventOptions,
      required: true,
      comments: "Select the event to to subscribe for this webhook",
    }),
    url: input({
      label: "URL",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments:
        "URL to the endpoint that receives the webhook events and payloads",
    }),
  },
  examplePayload: {
    data: {
      id: "txn0000000000000.fsb0000.wid000000",
      url: "string",
      isActive: true,
      fundId: "txn0000000000000.fsb0000",
      enabledEvents: ["new_investor_added"],
      responseType: "string",
    },
  },
});

const removeWebhook = action({
  display: {
    label: "Remove Webhook",
    description: "Remove a webhook endpoint",
  },
  perform: async (context, { connection, fundId, webhookEndpointId }) => {
    const client = createFSClient(connection);
    const { data } = await client.delete(
      `/api/v1/fundsub/${fundId}/webhook/${webhookEndpointId}`,
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
    webhookEndpointId: input({
      label: "Webhook Endpoint Id",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
      comments: "The unique ID of the Webhook endpoint",
    }),
  },
  examplePayload: {
    data: {
      success: true,
      responseType: "string",
    },
  },
});

const getStandardFormFields = action({
  display: {
    label: "Get Standard Form Fields",
    description: "Get Standard Form Fields",
  },
  perform: async (context, { connection, fundId }) => {
    const standardFields = await getStandardFormFieldsAPI(connection, fundId);
    return { data: standardFields };
  },
  inputs: {
    connection: fsConnectionInput,
    fundId: fundIdInput,
  },
  examplePayload: {
    data: {
      fields: [
        {
          title: "string",
          description: "string",
          availableValues: [
            {
              value: "string",
              description: "string",
            },
          ],
          dataType: "string",
        },
      ],
      responseType: "string",
    },
  },
});

const getStandardFormField = action({
  display: {
    label: "Get Standard Form Field",
    description: "Get Standard Form Field",
  },
  perform: async (context, { connection, anduinStandardAlias }) => {
    const client = createFSClient(connection);
    const { data } = await client.get(
      `/api/v1/fundsub/standardFormField/${anduinStandardAlias}`,
    );
    return { data };
  },
  inputs: {
    connection: fsConnectionInput,
    anduinStandardAlias: input({
      label: "Anduin Standard Alias",
      type: "string",
      required: true,
      clean: (value): string | undefined =>
        util.types.toString(value) || undefined,
    }),
  },
  examplePayload: {
    data: {
      field: {
        title: "string",
        description: "string",
        availableValues: [
          {
            value: "string",
            description: "string",
          },
        ],
        dataType: "string",
      },
      responseType: "string",
    },
  },
});


export default {
  // Rest API components
  getFundInfo,
  updateClose,
  inviteInvestor,
  bulkInviteInvestor,
  getOrdersFormData,
  updaterOrder,
  activateOfflineOrder,
  getFileDownloadUrl,
  getRequestStatus,
  fundLink,
  getAllFundWebhooks,
  createWebhook,
  getWebhook,
  updateWebhook,
  removeWebhook,
  getStandardFormFields,
  getStandardFormField,

  // GraphQL query wrapper components
  getOrderStatus,
  getOrderDocuments,
};
