import { connection } from "@prismatic-io/spectral";
import { environmentInputOptions } from "./util";

export const apiKeyAuth = connection({
  key: "apiKeyAuth",
  label: "Fund Sub API Key Authentication",
  comments: "Anduin provided API key",
  inputs: {
    environment: {
      label: "Environment",
      type: "string",
      model: environmentInputOptions,
      required: true,
      comments: "Select the Sandbox or Production environment",
      default: "https://api-demo.anduin.app",
    },
    apiKey: {
      label: "API Key",
      type: "password",
      required: true,
    },
  },
});

export default [apiKeyAuth];
