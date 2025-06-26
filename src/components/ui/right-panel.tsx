import { Button } from "./button"
import { Card } from "./card"
import { FileIcon, ImageIcon, FileTextIcon } from "lucide-react"

interface HistoryItem {
  name: string
  size: string
  type: "jpg" | "png" | "svg" | "doc" | "pdf"
}

interface RightPanelProps {
  historyItems?: HistoryItem[]
}

const getFileIcon = (type: HistoryItem["type"]) => {
  switch (type) {
    case "jpg":
    case "png":
      return ImageIcon
    case "svg":
      return FileIcon
    default:
      return FileTextIcon
  }
}

const getFileColor = (type: HistoryItem["type"]) => {
  switch (type) {
    case "jpg":
      return "text-blue-500"
    case "png":
      return "text-yellow-500"
    case "svg":
      return "text-green-500"
    case "doc":
      return "text-purple-500"
    case "pdf":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

export function RightPanel({ historyItems = [] }: RightPanelProps) {
  return (
    <div className="w-80 h-screen p-4 space-y-6">
      {/* AI Converter Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6">
        <div className="inline-block bg-white/20 rounded-lg px-3 py-1 text-sm mb-4">
          New feature
        </div>
        <h3 className="text-2xl font-bold mb-2">AI Converter</h3>
        <p className="text-white/80 mb-6">
          Vectorize your images with AI
          <br />
          Extract layers from PDF
        </p>
        <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-white/90">
          Try Now
        </Button>
      </Card>

      {/* History Section */}
      <div>
        <h3 className="font-medium mb-4">History</h3>
        <div className="space-y-2">
          {historyItems.map((item, index) => {
            const Icon = getFileIcon(item.type)
            return (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${getFileColor(item.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.size}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 