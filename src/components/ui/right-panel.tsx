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
  onClearAll?: () => void
}

export function RightPanel({ historyItems, onDownload, onDelete, onClearAll }: RightPanelProps) {
  return (
    <div className="w-80 h-screen border-l-4 border-orange-200 bg-white p-6 overflow-auto shadow-xl">
      <div className="mb-6 bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-heading font-bold text-gray-900">History</h2>
          {historyItems.length > 0 && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold"
            >
              Clear All
            </Button>
          )}
        </div>
        <p className="text-sm text-orange-soft font-semibold">Your conversion timeline</p>
      </div>
      
      {historyItems.length === 0 ? (
        <div className="text-center text-gray-500 mt-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
            <FileImage className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg">No History Yet</h3>
          <p className="text-sm mt-2 text-gray-600">Your converted files will show up here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all hover:shadow-lg bg-white"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 truncate" title={item.convertedName}>
                    {item.convertedName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-green-100 hover:text-green-600 rounded-lg"
                    onClick={() => onDownload(item)}
                    disabled={!item.downloadUrl}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Original:</span>
                  <span className="font-bold text-sm text-gray-900">{item.originalSize}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-orange-soft uppercase tracking-wide">{item.format}:</span>
                  <span className="font-bold text-sm text-green-600">{item.convertedSize}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 