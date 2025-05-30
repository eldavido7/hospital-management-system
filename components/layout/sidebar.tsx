"use client";

import type React from "react";

import { useRouter, usePathname } from "next/navigation";
import { useAuth, type UserRole } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  ClipboardList,
  CreditCard,
  Activity,
  Stethoscope,
  Syringe,
  FlaskRoundIcon as Flask,
  Pill,
  FileText,
  BarChart4,
  Home,
  Settings,
  SyringeIcon,
  X,
  Bed,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Update the sidebar to include the HMO Desk page for HMO desk users and super admins
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      roles: [
        "super_admin",
        "manager",
        "registration",
        "cash_point",
        "vitals",
        "doctor",
        "injection_room",
        "lab",
        "pharmacist",
        "hmo_desk",
        "hmo_admin",
        "records_officer",
      ],
    },
    {
      title: "Patients List",
      href: "/patients/search",
      icon: <Users className="h-5 w-5" />,
      roles: [
        "super_admin",
        "manager",
        "registration",
        "cash_point",
        "vitals",
        "doctor",
        "injection_room",
        "lab",
        "pharmacist",
        "hmo_desk",
        "hmo_admin",
        "records_officer",
      ],
    },
    {
      title: "Patient Registration",
      href: "/patients/register",
      icon: <Users className="h-5 w-5" />,
      roles: ["super_admin", "manager", "registration", "hmo_desk"],
    },
    {
      title: "Appointments",
      href: "/appointments",
      icon: <ClipboardList className="h-5 w-5" />,
      roles: ["super_admin", "manager", "registration", "doctor", "hmo_desk"],
    },
    {
      title: "Billing",
      href: "/billing",
      icon: <CreditCard className="h-5 w-5" />,
      roles: ["super_admin", "manager", "cash_point"],
    },
    {
      title: "Vitals",
      href: "/vitals",
      icon: <Activity className="h-5 w-5" />,
      roles: ["super_admin", "manager", "vitals"],
    },
    {
      title: "Doctor's Queue",
      href: "/doctor/queue",
      icon: <Stethoscope className="h-5 w-5" />,
      roles: ["super_admin", "manager", "doctor", "vitals"],
    },
    {
      title: "Injection Room",
      href: "/injection-room",
      icon: <Syringe className="h-5 w-5" />,
      roles: ["super_admin", "manager", "injection_room"],
    },
    {
      title: "Laboratory",
      href: "/laboratory",
      icon: <Flask className="h-5 w-5" />,
      roles: ["super_admin", "manager", "lab"],
    },
    {
      title: "Pharmacy",
      href: "/pharmacy",
      icon: <Pill className="h-5 w-5" />,
      roles: ["super_admin", "manager", "pharmacist"],
    },
    {
      title: "HMO Desk",
      href: "/hmo-desk",
      icon: <FileText className="h-5 w-5" />,
      roles: ["super_admin", "manager", "hmo_desk"],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart4 className="h-5 w-5" />,
      roles: ["super_admin", "manager", "records_officer", "hmo_admin"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["super_admin", "manager"],
    },
    {
      title: "Vaccinations",
      href: "/vaccinations",
      icon: <SyringeIcon className="h-5 w-5" />,
      roles: ["super_admin", "manager", "registration"],
    },
    {
      title: "Inpatient",
      href: "/inpatient",
      icon: <Bed className="h-5 w-5" />,
      roles: ["super_admin", "manager", "injection_room", "doctor"],
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto dark:bg-card",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <h2 className="text-xl font-bold text-primary">HMS</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-3 py-4">
            <nav className="space-y-1">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sm font-medium",
                    pathname === item.href
                      ? "bg-secondary text-secondary-foreground"
                      : "text-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                  onClick={() => {
                    router.push(item.href);
                    if (open && window.innerWidth < 1024) {
                      setOpen(false);
                    }
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Button>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
