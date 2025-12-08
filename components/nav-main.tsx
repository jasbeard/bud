"use client";

import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { NewTransactionDialog } from "./new-transaction-dialog";
import { EyeIcon, PlusIcon, ShareIcon } from "lucide-react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    mainIcon?: Icon;
    actionIcon?: Icon;
  }[];
}) {
  const { isMobile } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 cursor-pointer">
            <NewTransactionDialog>
              <SidebarMenuButton
                tooltip="New Transaction"
                className="bg-primary cursor-pointer font-medium rounded-full py-5 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <IconCirclePlusFilled />
                <span>New Transaction</span>
              </SidebarMenuButton>
            </NewTransactionDialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link href={item.url}>
                  {item.mainIcon && <item.mainIcon />}
                  <span>{item.title}</span>
                  {/* {item.actionIcon && <item.actionIcon />} */}
                </Link>
              </SidebarMenuButton>
              {item.actionIcon && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction>
                      {item.actionIcon && <item.actionIcon />}
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem>
                      <EyeIcon className="text-muted-foreground" />
                      <span>View Budget</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <PlusIcon className="text-muted-foreground" />
                      <span>Create Budget</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ShareIcon className="text-muted-foreground" />
                      <span>Share Budget</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
