import { component } from "@prismatic-io/spectral";
import { handleErrors } from "@prismatic-io/spectral/dist/clients/http";
import actions from "./actions";
import connections from "./connections";
import triggers from "./triggers";
import dataSources from "./dataSources/dataSourceIndex";

export default component({
  key: "anduinFundsubIntegration",
  display: {
    label: "Anduin Fund Subscription",
    description: "Components for Fund Subscription",
    iconPath: "anduin-logo.png",
  },
  hooks: { error: handleErrors },
  actions: actions,
  triggers,
  connections,
  dataSources,
});
