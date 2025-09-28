import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000/api/auth", // The base URL of your auth server
});
