// Available pathnames for the application
export enum AppPages {
  // Static routes
  HOME = "/",
  DASHBOARD = "/dashboard",
  BUDGET = "/budget",
  LOGIN = "/login",
  SIGNUP = "/signup",
  ONBOARDING = "/onboarding",

  // settings
  GENERAL_SETTINGS = "/settings/general",
  BUDGETCYCLE_SETTINGS = "/settings/budgetcycle",

  // Dynamic routes - use template literal for dynamic parts
  BUDGETSPACE = "/budgetspaces",
}
