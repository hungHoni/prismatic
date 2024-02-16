import {
  createConnection,
  invoke,
  invokeDataSource,
} from "@prismatic-io/spectral/dist/testing";
import { apiKeyAuth } from "./connections";
import actions from "./actions";
import dataSources from "./dataSources/dataSourceIndex";
import { TriggerPayload } from "@prismatic-io/spectral";
import { getPayloadEvent } from "./triggers";
import { defaultTemplate } from "./dataSources/fsDataSource";


const fundId = "txn385z8dl200pj1.fsbyp4p";

const anduinFsConnection = createConnection(apiKeyAuth, {
  environment: "https://api-demo.anduin.app",
  apiKey: process.env.ANDUIN_API_KEY, // Get API key from an environment variable
});

describe("Actions", () => {
  test("should be able to get fund info", async () => {
    const { result } = await invoke(actions.getFundInfo, {
      connection: anduinFsConnection,
      fundId,
    });

    expect(result?.data?.id).toEqual(fundId);
  });

  test("should be able to get form data", async () => {
    const orderIds = ["txn385z8dl200pj1.fsbyp4p.lpp5dn0r1j"];
    const templateId = undefined;
    const { result } = await invoke(actions.getOrdersFormData, {
      connection: anduinFsConnection,
      fundId: fundId,
      orderIds: orderIds,
      templateId: templateId,
    });

    expect(result?.data?.orders[0].orderId).toEqual(orderIds[0]);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let createdWebhook = "";

  test("should be able to register a webhook", async () => {
    const toEnableEvents = ["new_investor_added"];
    const url =
      "https://hooks.prismatic.io/trigger/SW5zdGFuY2VGbG93Q29uZmlnOjFiYjczMDhjLTNhNzItNGY0YS1iM2IzLTkyNjE5MDAzZmU5Ng==";
    const { result } = await invoke(actions.createWebhook, {
      connection: anduinFsConnection,
      fundId: fundId,
      enabledEvents: toEnableEvents,
      url: url,
    });

    createdWebhook = result?.data?.id;

    expect(result?.data?.enabledEvents).toEqual(toEnableEvents);
  });

  test("should be able to remove a webhook", async () => {
    const { result } = await invoke(actions.removeWebhook, {
      connection: anduinFsConnection,
      fundId: fundId,
      webhookEndpointId: createdWebhook,
    });

    expect(result?.data?.success).toEqual(true);
  });

  test("should be able to get order status", async () => {
    const orderId = "txn385z8dl200pj1.fsbyp4p.lpp5dn0r1j";
    const { result } = await invoke(actions.getOrderStatus, {
      connection: anduinFsConnection,
      orderId: orderId,
    });

    expect(result?.data.status).toEqual("NOT_STARTED");
  });

  test("should be able to get submitted document of an order", async () => {
    const orderId = "txn385z8dl200pj1.fsbyp4p.lpp94807r1";
    const { result } = await invoke(actions.getOrderDocuments, {
      connection: anduinFsConnection,
      orderId: orderId,
    });

    expect(result?.data.uploadedCountersignedDocs.length).toEqual(18);
  });

  test("should be able to get standard fields", async () => {
    const { result } = await invoke(actions.getStandardFormFields, {
      connection: anduinFsConnection,
      fundId: fundId,
    });

    expect(result?.data.fields.length).toBeGreaterThan(1);
  });
});

describe("FundSub data sources", () => {
  test("should be able to get fund subs from the query fund data source", async () => {
    const { result } = await invokeDataSource(dataSources.selectFund, {
      anduinFsConnection: anduinFsConnection,
    });

    expect(result.length).toEqual(11);
  });

  test("should be able to get templates from a fund", async () => {
    const { result } = await invokeDataSource(dataSources.selectTemplate, {
      anduinFsConnection: anduinFsConnection,
      fundId: fundId,
    });

    expect(result).toContain(defaultTemplate);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// describe("Triggers", () => {
//   test("returns the correct event when the payload is valid", () => {
//     const payload: TriggerPayload = {
//       headers: {},
//       queryParameters: {},
//       rawBody: {
//         data: {},
//       },
//       body: {
//         data: {
//           event: "new_investor_added",
//           otherData: "some other data",
//         },
//       },
//       pathFragment: "",
//       webhookUrls: {},
//       webhookApiKeys: {},
//       invokeUrl: "",
//       executionId: "",
//       startedAt: "",
//       customer: {
//         id: "",
//         externalId: "",
//         name: "",
//       },
//       instance: {
//         id: "",
//         name: "",
//       },
//       user: {
//         id: "",
//         email: "",
//         name: "",
//         externalId: "",
//       },
//       integration: {
//         id: "",
//         name: "",
//         versionSequenceId: "",
//       },
//       flow: {
//         id: "",
//         name: "",
//       },
//     };

//     expect(getPayloadEvent(payload)).toBe("new_investor_added");
//   });

//   test("throws an error when body.data is empty", () => {
//     const payload: TriggerPayload = {
//       headers: {},
//       queryParameters: {},
//       rawBody: {
//         data: {},
//       },
//       body: {
//         data: "",
//       },
//       pathFragment: "",
//       webhookUrls: {},
//       webhookApiKeys: {},
//       invokeUrl: "",
//       executionId: "",
//       startedAt: "",
//       customer: {
//         id: "",
//         externalId: "",
//         name: "",
//       },
//       instance: {
//         id: "",
//         name: "",
//       },
//       user: {
//         id: "",
//         email: "",
//         name: "",
//         externalId: "",
//       },
//       integration: {
//         id: "",
//         name: "",
//         versionSequenceId: "",
//       },
//       flow: {
//         id: "",
//         name: "",
//       },
//     };

//     expect(() => getPayloadEvent(payload)).toThrow(
//       "Event not received: bodyData is empty or not an object",
//     );
//   });

//   test("throws an error when the event field is missing", () => {
//     const payload: TriggerPayload = {
//       headers: {},
//       queryParameters: {},
//       rawBody: {
//         data: {},
//       },
//       body: {
//         data: {
//           otherData: "some other data",
//         },
//       },
//       pathFragment: "",
//       webhookUrls: {},
//       webhookApiKeys: {},
//       invokeUrl: "",
//       executionId: "",
//       startedAt: "",
//       customer: {
//         id: "",
//         externalId: "",
//         name: "",
//       },
//       instance: {
//         id: "",
//         name: "",
//       },
//       user: {
//         id: "",
//         email: "",
//         name: "",
//         externalId: "",
//       },
//       integration: {
//         id: "",
//         name: "",
//         versionSequenceId: "",
//       },
//       flow: {
//         id: "",
//         name: "",
//       },
//     };

//     expect(() => getPayloadEvent(payload)).toThrow(
//       "Event not received: event field not found",
//     );
//   });
// }

// );
