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
