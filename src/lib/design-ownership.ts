import type { DemoState, DesignOwnershipRequest } from "@/lib/types";

export function latestDesignOwnershipRequest(
  state: DemoState,
  portfolioItemId: string,
): DesignOwnershipRequest | null {
  const requests = state.designOwnershipRequests ?? [];
  for (let index = requests.length - 1; index >= 0; index -= 1) {
    const request = requests[index];
    if (request?.portfolioItemId === portfolioItemId) return request;
  }
  return null;
}

export function hasVerifiedDesignOwnership(state: DemoState, portfolioItemId: string) {
  return latestDesignOwnershipRequest(state, portfolioItemId)?.status === "approved";
}
