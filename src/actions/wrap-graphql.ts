import { action } from "@prismatic-io/spectral";
import { createGraphQLClient } from "../client";
import {
  GET_ORDER_STATUS_QUERY,
  getOrderSubmittedDocumentsQuery,
  NUM_DOC_BATCH,
} from "./queries";
import { fsConnectionInput, orderIdInput } from "../inputs";

interface OrderStatusQueryResult {
  getOrder: {
    id: string;
    customId: string;
    orderType: string;
    status: string;
    investmentEntity: string;
    estimatedCommitmentAmount: string;
    submittedCommitmentAmount: string;
    acceptedCommitmentAmount: string;
  };
}

interface OrderDocumentResult {
  id: string;
  file: {
    id: string;
    name: string;
  };
  docType: string;
  documentType: string;
}

interface SupportingDocumentResult {
  id: string;
  name: string;
  markedAsNa: boolean;
  submitted: boolean;
  submittedDocs: OrderDocumentResult[];
}

interface OrderDocsResult {
  supportingDocs: SupportingDocumentResult[];
  submittedDocs: OrderDocumentResult[];
  uploadedCountersignedDocs: OrderDocumentResult[];
  countersignedDocs: OrderDocumentResult[];
}

interface OrderSubmittedDocumentsResult {
  getOrder: OrderDocsResult;
}

export const getOrderStatus = action({
  display: {
    label: "Get Order Status",
    description: "Get order status using the getOrder GraphQL query",
  },
  perform: async (context, { connection, orderId }) => {
    const graphqlClient = createGraphQLClient(connection);
    const data = await graphqlClient.request<OrderStatusQueryResult>(
      GET_ORDER_STATUS_QUERY,
      { id: orderId },
    );
    return { data: data.getOrder };
  },
  inputs: {
    connection: fsConnectionInput,
    orderId: orderIdInput,
  },
  examplePayload: {
    data: {
      id: "orderId",
      customId: "customId",
      orderType: "NORMAL",
      status: "NOT_STARTED",
      investmentEntity: "Harry Williams",
      estimatedCommitmentAmount: "10000000",
      submittedCommitmentAmount: "10000000",
      acceptedCommitmentAmount: "1000000",
    },
  },
});

export const getOrderDocuments = action({
  display: {
    label: "Get Submitted Documents of an Order",
    description:
      "Get submitted documents of an order using the getOrder GraphQL query",
  },
  perform: async (
    context,
    { connection, orderId },
  ): Promise<{ data: OrderDocsResult }> => {
    const graphqlClient = createGraphQLClient(connection);

    const fetchDocs = async (
      supportingDocsOffset = 0,
      submittedDocsOffset = 0,
      uploadedCountersignedDocsOffset = 0,
      countersignedDocsOffset = 0,
      aggregatedResult: OrderSubmittedDocumentsResult | null = null,
    ): Promise<OrderSubmittedDocumentsResult> => {
      const query = getOrderSubmittedDocumentsQuery(
        supportingDocsOffset,
        submittedDocsOffset,
        uploadedCountersignedDocsOffset,
        countersignedDocsOffset,
      );

      const result = await graphqlClient.request<OrderSubmittedDocumentsResult>(
        query,
        { id: orderId },
      );

      // Check if result.getOrder and its fields are defined
      if (!result.getOrder) {
        throw new Error("Invalid response structure: expecting getOrder");
      }

      const combinedResult: OrderSubmittedDocumentsResult = aggregatedResult
        ? {
            getOrder: {
              supportingDocs: [
                ...(aggregatedResult.getOrder.supportingDocs || []),
                ...(result.getOrder.supportingDocs || []),
              ],
              submittedDocs: [
                ...(aggregatedResult.getOrder.submittedDocs || []),
                ...(result.getOrder.submittedDocs || []),
              ],
              uploadedCountersignedDocs: [
                ...(aggregatedResult.getOrder.uploadedCountersignedDocs || []),
                ...(result.getOrder.uploadedCountersignedDocs || []),
              ],
              countersignedDocs: [
                ...(aggregatedResult.getOrder.countersignedDocs || []),
                ...(result.getOrder.countersignedDocs || []),
              ],
            },
          }
        : result;

      // Check if there are more documents to fetch in each category
      const moreSupportingDocs =
        result.getOrder.supportingDocs.length > supportingDocsOffset;
      const moreSubmittedDocs =
        result.getOrder.submittedDocs.length > submittedDocsOffset;
      const moreUploadedCountersignedDocs =
        result.getOrder.uploadedCountersignedDocs.length >
        uploadedCountersignedDocsOffset;
      const moreCountersignedDocs =
        result.getOrder.countersignedDocs.length > countersignedDocsOffset;

      // Recursive calls if more documents exist
      if (
        moreSupportingDocs ||
        moreSubmittedDocs ||
        moreUploadedCountersignedDocs ||
        moreCountersignedDocs
      ) {
        return await fetchDocs(
          moreSupportingDocs
            ? supportingDocsOffset + NUM_DOC_BATCH
            : supportingDocsOffset,
          moreSubmittedDocs
            ? submittedDocsOffset + NUM_DOC_BATCH
            : submittedDocsOffset,
          moreUploadedCountersignedDocs
            ? uploadedCountersignedDocsOffset + NUM_DOC_BATCH
            : uploadedCountersignedDocsOffset,
          moreCountersignedDocs
            ? countersignedDocsOffset + NUM_DOC_BATCH
            : countersignedDocsOffset,
          combinedResult, // pass the combined result to the next recursive call
        );
      }

      return combinedResult; // Return the combined result
    };

    const data = await fetchDocs();

    return { data: data.getOrder };
  },
  inputs: {
    connection: fsConnectionInput,
    orderId: orderIdInput,
  },
  examplePayload: {
    data: {
      supportingDocs: [
        {
          id: "docid",
          name: "tax doc",
          markedAsNa: false,
          submitted: true,
          submittedDocs: [
            {
              id: "docid",
              file: {
                id: "fileid",
                name: "w-9.pdf",
              },
              docType: "FilledForm",
              documentType: "FilledForm",
            },
          ],
        },
      ],
      submittedDocs: [
        {
          id: "docid",
          file: {
            id: "fileid",
            name: "w-9.pdf",
          },
          docType: "FilledForm",
          documentType: "FilledForm",
        },
      ],
      uploadedCountersignedDocs: [
        {
          id: "docid",
          file: {
            id: "fileid",
            name: "w-9.pdf",
          },
          docType: "FilledForm",
          documentType: "FilledForm",
        },
      ],
      countersignedDocs: [
        {
          id: "docid",
          file: {
            id: "fileid",
            name: "w-9.pdf",
          },
          docType: "FilledForm",
          documentType: "FilledForm",
        },
      ],
    },
  },
});
