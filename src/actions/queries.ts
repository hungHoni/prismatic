import { gql } from "graphql-request";

export const GET_ORDER_STATUS_QUERY = gql`
  query getOrder($id: String!) {
    getOrder(id: $id) {
      id
      customId
      orderType
      status
      investmentEntity
      estimatedCommitmentAmount
      submittedCommitmentAmount
      acceptedCommitmentAmount
    }
  }
`;

const ORDER_DOCUMENT = `{
  id
  file {
    id
    name
  }
  docType
  documentType
}`;

export const GET_FUND_SUBSCRIPTIONS_QUERY = gql`
  query queryFundSubscription($first: Int, $offset: Int) {
    queryFundSubscription(first: $first, offset: $offset) {
      id
      customFundId
      name
      currency
      supportingDocReviewEnabled
      createdAt
      inactiveNotificationEnabled
      inactiveNotificationDuration
      lastUpdatedAt
    }
  }
`;

export const NUM_DOC_BATCH = 10;

export const getOrderSubmittedDocumentsQuery = (
  supportingDocsOffset: number,
  submittedDocsOffset: number,
  uploadedCountersignedDocsOffset: number,
  countersignedDocsOffset: number,
) => {
  const supportingDocsFirst = supportingDocsOffset + NUM_DOC_BATCH;
  const submittedDocsFirst = submittedDocsOffset + NUM_DOC_BATCH;
  const uploadedCountersignedDocsFirst =
    uploadedCountersignedDocsOffset + NUM_DOC_BATCH;
  const countersignedDocsFirst = countersignedDocsOffset + NUM_DOC_BATCH;

  return gql` 
    query getOrder($id: String!) {
      getOrder(id: $id) {
        supportingDocs(first: ${supportingDocsFirst}, offset: ${supportingDocsOffset}) {
          id
          name
          markedAsNa
          submitted
          submittedDocs(first: 20) ${ORDER_DOCUMENT}
        }
        submittedDocs(first: ${submittedDocsFirst}, offset: ${submittedDocsOffset}) ${ORDER_DOCUMENT}
        uploadedCountersignedDocs(first: ${uploadedCountersignedDocsFirst}, offset: ${uploadedCountersignedDocsOffset}) ${ORDER_DOCUMENT}
        countersignedDocs(first: ${countersignedDocsFirst}, offset: 0) ${ORDER_DOCUMENT}
      }
    }
  `;
};

