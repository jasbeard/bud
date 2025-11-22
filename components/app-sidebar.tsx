"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconUsers,
  IconCoins,
  IconPigMoney,
  IconInvoice,
  IconDeviceAudioTape,
  IconCommand,
  IconCategory2,
  IconFileExport,
  IconAdjustmentsCog,
  IconCalendarRepeat,
  IconDotsVertical,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BudgetSpaceSwitcher } from "./budget-space-switcher";
import { NavSettings } from "./nav-settings";
import { AppPages } from "@/lib/types";

const data = {
  budgetSpace: [
    {
      name: "Household",
      logo: IconInnerShadowTop,
      plan: "Pro",
    },
    {
      name: "Travel",
      logo: IconDeviceAudioTape,
      plan: "Basic",
    },
    {
      name: "Personal",
      logo: IconCommand,
      plan: "Lifetime",
    },
  ],
  user: {
    name: "Jason",
    email: "me@jasonbarba.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: AppPages.DASHBOARD,
      mainIcon: IconDashboard,
    },
    {
      title: "Budget",
      url: AppPages.BUDGET,
      mainIcon: IconCoins,
      actionIcon: IconDotsVertical,
    },
    {
      title: "Insight",
      url: "#",
      mainIcon: IconChartBar,
    },
    {
      title: "Transactions",
      url: "#",
      mainIcon: IconInvoice,
    },
    {
      title: "Collaborate",
      url: "#",
      mainIcon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Networth",
      url: "#",
      icon: IconPigMoney,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  settings: [
    {
      name: "General",
      url: "#",
      icon: IconAdjustmentsCog,
    },
    {
      name: "Budget Cycle",
      url: AppPages.BUDGETCYCLE,
      icon: IconCalendarRepeat,
    },
    {
      name: "Transaction Categories",
      url: "#",
      icon: IconCategory2,
    },
    {
      name: "Export Data",
      url: "#",
      icon: IconFileExport,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <BudgetSpaceSwitcher spaces={data.budgetSpace} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSettings items={data.settings} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
