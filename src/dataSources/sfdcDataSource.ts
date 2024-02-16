import {
  Connection,
  ObjectSelection,
  dataSource,
  input,
  util,
} from "@prismatic-io/spectral";

// eslint-disable-next-line import/default
import jsforce from "jsforce";
import { fsConnectionInput, fundIdInput, templateIdInput } from "../inputs";
import { getFundInfoAPI, getStandardFormFieldsAPI } from "../actions/utils";
import { defaultTemplate } from "./fsDataSource";

const getSfdcClient = (sfConnection: Connection) => {
  const salesforceClient = new jsforce.Connection({
    instanceUrl: util.types.toString(sfConnection.token?.instance_url),
    version: "51.0",
    accessToken: util.types.toString(sfConnection.token?.access_token),
  });
  return salesforceClient;
};

export const getSfdcFields = async (
  sfdcConnection: Connection,
  selectedObject: ObjectSelection,
) => {
  const salesforceClient = getSfdcClient(sfdcConnection);

  // Fetch all fields on a Lead using https://jsforce.github.io/document/#describe
  const { fields } = await salesforceClient
    .sobject(selectedObject[0].object.key)
    .describe();
  return fields;
};

const systemFields = [
  {
    id: "pd_investor_id",
    name: "Order Id",
  },
  {
    id: "pd_order_status",
    name: "Order status",
  },
  {
    id: "pd_order_type",
    name: "Order type",
  },
  {
    id: "pd_fund_id",
    name: "Fund Id",
  },
  {
    id: "pd_fund_name",
    name: "Fund Name",
  },
  {
    id: "pd_email_address",
    name: "Email address",
  },
  {
    id: "pd_firm_name",
    name: "Firm name",
  },
  {
    id: "pd_expected_commitment",
    name: "Expected commitment amount",
  },
  {
    id: "pd_submitted_commitment",
    name: "Submitted commitment amount",
  },
  {
    id: "pd_accepted_commitment",
    name: "Accepted commitment amount",
  },
];

const getFsTemplateFields = async (
  anduinFsConnection: Connection,
  fundId: string | undefined,
  templateId: string | undefined,
) => {
  if (templateId === defaultTemplate.key) {
    const results = await getStandardFormFieldsAPI(anduinFsConnection, fundId);
    const fields = results.fields.map((field) => ({
      id: field.title,
      name:
        field.title +
        (field.description ? ` (Field label: ${field.description})` : ""),
    }));
    return fields.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const fundInfo = await getFundInfoAPI(anduinFsConnection, fundId);
    if (fundInfo.templates) {
      const matchedTemplate = fundInfo.templates.find(
        (template) => template.id === templateId,
      );

      const fields = matchedTemplate ? matchedTemplate.fields : [];
      return fields
        .map((name, index) => ({
          id: index + 1,
          name: name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return [];
    }
  }
};

export const sfdcFieldMappingDataSource = dataSource({
  dataSourceType: "jsonForm",
  display: {
    label: "Salesforce field mapping",
    description: "Map fields from to the select Salesforce object",
  },
  inputs: {
    anduinFsConnection: fsConnectionInput,
    sfdcConnection: input({
      label: "Salesforce OAuth 2.0 Connection",
      type: "connection",
      required: true,
    }),
    fundId: fundIdInput,
    templateId: templateIdInput,
    selectedSfdcObject: input({
      label: "SFDC object",
      type: "objectSelection",
      required: true,
      clean: (value) => util.types.toObjectSelection(value),
    }),
  },
  perform: async (
    context,
    {
      anduinFsConnection,
      sfdcConnection,
      fundId,
      templateId,
      selectedSfdcObject,
    },
  ) => {
    const salesforceObjectFields = await getSfdcFields(
      sfdcConnection,
      selectedSfdcObject,
    );

    // // Filter out non-required fields
    // const salesforceObjectFields = sfdcFields.filter(
    //   ({ nillable }) => !nillable,
    // );

    const fsTemplateFields = await getFsTemplateFields(
      anduinFsConnection,
      fundId,
      templateId,
    );

    const fsFields = [...systemFields, ...fsTemplateFields];

    // Schema defines the shape of the object to be returned to the integration,
    // along with options for dropdown menus
    const schema = {
      type: "object",
      properties: {
        mymappings: {
          // Arrays allow users to make one or more mappings
          type: "array",
          items: {
            // Each object in the array should contain a salesforceField and a template field
            type: "object",
            properties: {
              fsTemplateField: {
                type: "string",
                oneOf: fsFields.map((field) => ({
                  title: field.name,
                  const: util.types.toString(field.id), // JSON Forms requires string values
                })),
              },
              salesforceLeadField: {
                type: "string",
                // Have users select "one of" a dropdown of items
                oneOf: salesforceObjectFields.map((field) => ({
                  // Display the pretty "label" like "My First Name" to the user
                  title: field.label,
                  // Feed programmatic "name" like "My_First_Name__c" to the integration
                  const: field.name,
                })),
              },
            },
          },
        },
      },
    };

    // UI Schema defines how the schema should be displayed in the configuration wizard
    const uiSchema = {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/mymappings",
          label: "Template field <> Salesforce Lead Field Mapper",
        },
      ],
    };

    // You can optionally provide default values for mappings.
    // This maps the first template field to the first SFDC field,
    // the second to the second, etc.
    const defaultValues = {
      mymappings: [
        {
          fsTemplateField: util.types.toString(fsFields[0].id),
          salesforceLeadField: undefined,
        },
        {
          fsTemplateField: util.types.toString(fsFields[1].id),
          salesforceLeadField: undefined,
        },
        {
          fsTemplateField: util.types.toString(fsFields[2].id),
          salesforceLeadField: undefined,
        },
      ],
    };

    return {
      result: { schema, uiSchema, data: defaultValues },
    };
  },
});
