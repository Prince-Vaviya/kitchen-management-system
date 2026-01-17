"use client";

import { ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSocket } from "@/components/providers/SocketProvider";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";

interface NavSection {
  id: string;
  label: string;
  icon: ReactNode;
  items?: { id: string; label: string }[];
}

interface ProfileLayoutProps {
  children: ReactNode;
  title: string;
  icon: ReactNode;
  sections: NavSection[];
  activeSection: string;
  activeSubItem?: string | null;
  onSectionChange: (sectionId: string) => void;
  onSubItemChange?: (itemId: string) => void;
}

export function ProfileLayout({
  children,
  title,
  icon,
  sections,
  activeSection,
  activeSubItem,
  onSectionChange,
  onSubItemChange,
}: ProfileLayoutProps) {
  const router = useRouter();
  const { isConnected } = useSocket();
  const [expandedSection, setExpandedSection] = useState<string | null>(
    activeSection,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === "signout") {
      // Clear cookie and redirect
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      router.push("/login");
      return;
    }

    const section = sections.find((s) => s.id === sectionId);
    if (section?.items && section.items.length > 0) {
      setExpandedSection(expandedSection === sectionId ? null : sectionId);
    }
    onSectionChange(sectionId);
    // Close mobile menu after selection
    setIsMobileMenuOpen(false);
  };

  const handleSubItemClick = (itemId: string) => {
    if (onSubItemChange) {
      onSubItemChange(itemId);
    }
    // Close mobile menu after selection
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
            <div className="text-white scale-75">{icon}</div>
          </div>
          <div>
            <h1 className="font-bold text-base text-gray-900">{title}</h1>
            <div
              className={`flex items-center gap-1.5 text-[10px] ${
                isConnected ? "text-green-600" : "text-gray-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              {isConnected ? "Connected" : "Offline"}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header (Desktop) */}
        <div className="hidden md:block p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <div className="text-white">{icon}</div>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">{title}</h1>
              <div
                className={`flex items-center gap-1.5 text-xs ${
                  isConnected ? "text-green-600" : "text-gray-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`}
                />
                {isConnected ? "Connected" : "Offline"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {sections
              .filter((s) => s.id !== "signout")
              .map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeSection === section.id
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {section.icon}
                    <span className="font-medium">{section.label}</span>
                    {section.items && section.items.length > 0 && (
                      <span
                        className={`ml-auto transition-transform ${
                          expandedSection === section.id ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    )}
                  </button>

                  {/* Sub-items */}
                  {section.items &&
                    expandedSection === section.id &&
                    activeSection === section.id && (
                      <div className="ml-4 mt-1 space-y-1">
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSubItemClick(item.id)}
                            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                              activeSubItem === item.id
                                ? "bg-gray-100 text-gray-900 font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                activeSubItem === item.id
                                  ? "bg-gray-900"
                                  : "bg-gray-300"
                              }`}
                            />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}
          </div>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => handleSectionClick("signout")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full md:w-auto">{children}</main>
    </div>
  );
}
