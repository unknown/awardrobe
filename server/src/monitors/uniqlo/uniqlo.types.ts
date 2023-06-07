export type UniqloType = {
  code: string;
  displayCode: string;
  name: string;
};

export type HeartbeatRequest = {
  productId: string;
};

type HeartbeatSuccess = {
  status: "success";
};

type HeartbeatError = {
  status: "error";
  error: string;
};

export type HeartbeatResponse = HeartbeatSuccess | HeartbeatError;

export type AddProductRequest = {
  productId: string;
};

type AddProductSuccess = {
  status: "success";
};

type AddProductError = {
  status: "error";
  error: string;
};

export type AddProductResponse = AddProductSuccess | AddProductError;
