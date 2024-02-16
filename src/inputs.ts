import { input, util } from "@prismatic-io/spectral";

export const fsConnectionInput = input({
  label: "Anduin Fund Subscription Connection",
  type: "connection",
  required: true,
});

export const orderIdInput = input({
  label: "The unique ID of the order",
  type: "string",
  required: true,
  clean: (value): string | undefined => util.types.toString(value) || undefined,
});

export const fundIdInput = input({
  label: "Fund Id",
  type: "string",
  required: true,
  clean: (value): string | undefined => util.types.toString(value) || undefined,
  comments: "The unique ID of the Fund Engagement",
});

export const templateIdInput = input({
  label: "Template Id",
  type: "string",
  required: false,
  example: "dtp00000000000000000.dtv0000000",
  clean: (value): string | undefined => util.types.toString(value) || undefined,
  comments: "The unique ID of the data template used for the Fund",
});
