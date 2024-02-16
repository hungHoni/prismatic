import { Connection } from "@prismatic-io/spectral";
import { createFSClient } from "../client";

export interface DataTemplate {
  id: string;
  name: string;
  templateType: string;
  fields: string[];
}

export interface GetFundInfoResult {
  id: string;
  customId: string;
  name: string;
  membersGroups: [
    {
      id: string;
      name: string;
      members: [
        {
          email: string;
          firstName: string;
          lastName: string;
        },
      ];
    },
  ];
  closes: [
    {
      id: string;
      name: string;
      targetDate: string;
    },
  ];
  templates: DataTemplate[];
  orderIds: string[];
}

export interface GetStandardFormFieldsResult {
  fields: [
    {
      title: string;
      description: string;
      availableValues: [
        {
          value: string;
          description: string;
        },
      ];
      dataType: string;
    },
  ];
  responseType: string;
}

export const getFundInfoAPI = async (
  connection: Connection,
  fundId: string | undefined,
): Promise<GetFundInfoResult> => {
  const client = createFSClient(connection);
  const { data } = await client.get(`/api/v1/fundsub/${fundId}`);
  return data;
};

export const getStandardFormFieldsAPI = async (
  connection: Connection,
  fundId: string | undefined,
): Promise<GetStandardFormFieldsResult> => {
  const client = createFSClient(connection);
  const { data } = await client.get(
    `/api/v1/fundsub/${fundId}/standardFormFields`,
  );
  return data;
};
