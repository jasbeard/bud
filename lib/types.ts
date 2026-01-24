// Available pathnames for the application
export enum AppPages {
  // Static routes
  HOME = "/",
  DASHBOARD = "/dashboard",
  BUDGET = "/budget",
  TRANSACTIONS = "/transactions",
  LOGIN = "/login",
  SIGNUP = "/signup",
  ONBOARDING = "/onboarding",
  PRICING = "/pricing",

  // settings
  GENERAL_SETTINGS = "/settings/general",
  BUDGETCYCLE_SETTINGS = "/settings/budgetcycle",

  // Dynamic routes - use template literal for dynamic parts
  BUDGETSPACE = "/budgetspaces",
}
