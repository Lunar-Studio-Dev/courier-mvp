"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  MapPin,
  IndianRupee,
  FileText,
  Box,
  Zap,
  Truck,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "~/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { trpc } from "~/trpc/client";

const navGroups = [
  {
    label: "Main",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        title: "Shipments",
        icon: Package,
        href: "/shipments",
        children: [
          { title: "All Shipments", href: "/shipments" },
          { title: "Create New", href: "/shipments/new" },
        ],
      },
      {
        title: "Customers",
        icon: Users,
        href: "/customers",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Branches", icon: Building2, href: "/branches" },
      { title: "Destinations", icon: MapPin, href: "/destinations" },
      { title: "Pricing Rules", icon: IndianRupee, href: "/pricing" },
      { title: "Invoice Templates", icon: FileText, href: "/invoices" },
    ],
  },
  {
    label: "Masters",
    items: [
      { title: "Product Types", icon: Box, href: "/product-types" },
      { title: "Service Types", icon: Zap, href: "/service-types" },
      { title: "Mode Types", icon: Truck, href: "/mode-types" },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Notifications",
        icon: Bell,
        href: "/settings/notifications",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const utils = trpc.useUtils();

  const signOutMutation = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      utils.invalidate();
      router.replace("/login");
    },
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TPC India</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Courier Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.children) {
                    const isOpen = item.children.some(
                      (child) => pathname === child.href,
                    );
                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={isOpen}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              isActive={pathname === item.href}
                            >
                              <item.icon />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === child.href}
                                  >
                                    <Link href={child.href}>
                                      <span>{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              onClick={() => signOutMutation.mutate()}
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
