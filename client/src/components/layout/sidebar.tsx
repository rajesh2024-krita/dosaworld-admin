import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import {
  Home,
  NotepadTextDashed,
  CalendarCheck,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const menuItems = [
  {
    section: "Main",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: Home,
        permission: "dashboard:read" as const,
      },
      {
        name: "Menu Management",
        path: "/menu-management",
        icon: NotepadTextDashed,
        permission: "dashboard:read" as const,
      },
      {
        name: "Reservation Management",
        path: "/reservation-management",
        icon: CalendarCheck,
        permission: "dashboard:read" as const,
      },
      {
        name: "Billing Management",
        path: "/billing-management",
        icon: CalendarCheck,
        permission: "dashboard:read" as const,
      },
      {
        name: "Inventory Management",
        path: "/inventory-management",
        icon: CalendarCheck,
        permission: "billing:read" as const,
      },
    ],
  },
  // {
  //   section: "Account",
  //   items: [
  //     {
  //       name: "Profile",
  //       path: "/profile",
  //       icon: UserCircle,
  //       permission: "dashboard:read" as const,
  //     },
  //   ],
  // },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 transform transition-transform duration-200 ease-in-out z-30 shadow-xl",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #064e3b 0%, #022c22 100%)", // green theme
          color: "#d1fae5",
        }}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center h-16 border-b border-green-900/40 mt-4">
          <img src={logo} alt="Logo" className="h-20" />
        </div>

        {/* User Info */}
        {/* {user && (
          <div className="flex flex-col items-center py-4 border-b border-green-900/40 text-sm">
            <div className="w-14 h-14 rounded-full bg-green-700 flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-green-200" />
            </div>
            <h2 className="mt-2 font-medium text-green-100">
              {user.name ?? "Guest User"}
            </h2>
            <p className="text-xs text-green-400">{user.email}</p>
          </div>
        )} */}

        {/* Menu Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 text-sm mt-4">
          {menuItems.map((section) => {
            const visibleItems = section.items.filter(
              (item) => user && hasPermission(user.permissions, item.permission)
            );

            if (!visibleItems.length) return null;

            return (
              <div key={section.section}>
                <p className="text-xs uppercase tracking-wide text-green-500 mb-2">
                  {section.section}
                </p>
                <div className="space-y-4">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          isActive
                            ? "bg-green-700 text-white shadow-md"
                            : "text-green-200 hover:bg-green-800 hover:text-white"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        {/* <div className="px-4 py-3 border-t border-green-900/40">
          <button className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-green-300 hover:bg-green-700 hover:text-white transition-all duration-200 text-sm">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div> */}
      </div>
    </>
  );
}