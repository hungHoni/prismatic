import { trigger, util } from "@prismatic-io/spectral";
import { TriggerPayload } from "@prismatic-io/spectral/dist/serverTypes";

const anduinValidationHeader = "x-anduin-webhook-validation-key";

export const getPayloadEvent = (payload: TriggerPayload) => {
  const bodyData = payload.body.data;

  if (typeof bodyData === "object" && bodyData !== null) {
    // Assuming bodyData is now a properly typed object
    const eventData = bodyData as { event?: string };

    if (eventData.event) {
      return eventData.event;
    } else {
      throw new Error("Event not received: event field not found");
    }
  } else {
    throw new Error("Event not received: bodyData is empty or not an object");
  }
};

export const webhook = trigger({
  display: {
    label: "Anduin Fund Subscription Webhook",
    description:
      "Handle and validate webhook requests from Anduin Fund Subscription",
  },
  allowsBranching: true,
  staticBranchNames: ["New Investor", "Status Changed", "URL Validation"],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  perform: async (context, payload, params) => {
    const headers = util.types.lowerCaseHeaders(payload.headers);
    const webhookSecret = headers[anduinValidationHeader];

    if (webhookSecret) {
      // This is the first time a webhook has been sent.
      console.log(`Got webhook validation ${webhookSecret}`);

      return Promise.resolve({
        payload,
        response: {
          statusCode: 200,
          headers: {
            "x-anduin-webhook-validation-key": webhookSecret,
          },
          contentType: "application/json",
        },
        branch: "URL Validation",
      });
    } else {
      console.debug(`Got webhook payload ${JSON.stringify(payload)}`);
      const event = getPayloadEvent(payload);

      if (event === "new_investor_added") {
        return Promise.resolve({
          payload,
          response: { statusCode: 200, contentType: "application/json" },
          branch: "New Investor",
          examplePayload: {
            fundId: "fundId",
            event: "new_investor_added",
            lpId: "orderId",
            createdAt: "2023-12-03T10:15:30Z",
          },
        });
      } else if (event === "subscription_status_changed") {
        return Promise.resolve({
          payload,
          response: { statusCode: 200, contentType: "application/json" },
          branch: "Status Changed",
          examplePayload: {
            fundId: "fundId",
            event: "subscription_status_changed",
            lpId: "orderId",
            previousStatus: "FORM_REVIEWED",
            newStatus: "SUBMITTED",
            createdAt: "2023-12-03T10:15:30Z",
          },
        });
      } else throw new Error(`Invalid event ${event}`);
    }
  },
  inputs: {},
  synchronousResponseSupport: "invalid",
  scheduleSupport: "invalid",
});

export default { webhook };
