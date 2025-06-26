import { Home, Files, Share, Settings, HelpCircle, LogOut, User } from "lucide-react"
import { Button } from "./button"
import { Separator } from "./separator"

interface SidebarProps {
  userName?: string
  userEmail?: string
  conversionsLeft?: number
  totalConversions?: number
}

export function Sidebar({ 
  userName = "Guest User", 
  userEmail = "guest@example.com",
  conversionsLeft = 5,
  totalConversions = 20
}: SidebarProps) {
  const menuItems = [
    { icon: Home, label: "Home", active: true },
    { icon: Files, label: "All files" },
    { icon: Share, label: "Shared by you" },
    { icon: Share, label: "Shared with you" },
    { icon: Settings, label: "Settings" },
    { icon: HelpCircle, label: "Support Center" },
  ]

  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-bold">Fast Convert</span>
      </div>

      <nav className="flex-1">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant={item.active ? "secondary" : "ghost"}
            className="w-full justify-start mb-1"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
        
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 mt-4">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </nav>

      <Separator className="my-4" />

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-sm">{userName}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {conversionsLeft}/{totalConversions} free conversions
        </div>
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          Upgrade now
        </Button>
      </div>
    </div>
  )
} 