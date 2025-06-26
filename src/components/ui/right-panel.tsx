import { FileImage, Download, Trash2 } from "lucide-react"
import { Button } from "./button"
import { formatDistanceToNow } from "date-fns"

export interface HistoryItem {
  id: string
  originalName: string
  convertedName: string
  originalSize: string
  convertedSize: string
  format: string
  timestamp: Date
  downloadUrl?: string
}

interface RightPanelProps {
  historyItems: HistoryItem[]
  onDownload: (item: HistoryItem) => void
  onDelete: (id: string) => void
}

export function RightPanel({ historyItems, onDownload, onDelete }: RightPanelProps) {
  return (
    <div className="w-80 h-screen border-l border-gray-200 bg-white p-6 overflow-auto">
      <h2 className="text-2xl font-bold mb-6">History</h2>
      
      {historyItems.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <FileImage className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No conversion history yet</p>
          <p className="text-sm">Converted files will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm truncate" title={item.convertedName}>
                    {item.convertedName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.downloadUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDownload(item)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Original:</span>
                  <span>{item.originalSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Converted ({item.format}):</span>
                  <span>{item.convertedSize}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 