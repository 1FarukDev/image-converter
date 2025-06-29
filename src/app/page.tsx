"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Upload, Download, AlertCircle, X, FileImage, Check, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Sidebar } from "@/components/ui/sidebar"
import { RightPanel, HistoryItem } from "@/components/ui/right-panel"
import { useToast } from "@/components/ui/toast"

interface FileItem {
  id: string
  file: File
  status: "pending" | "converting" | "completed" | "error"
  result?: Blob
  error?: string
  preview?: string
}

type OutputFormat = "webp" | "avif" | "jpeg" | "png"

const formatOptions = [
  { value: "webp" as OutputFormat, label: "WebP", description: "Best compression, wide support" },
  { value: "avif" as OutputFormat, label: "AVIF", description: "Superior compression, modern browsers" },
  { value: "jpeg" as OutputFormat, label: "JPEG", description: "Universal support, good for photos" },
  { value: "png" as OutputFormat, label: "PNG", description: "Lossless, supports transparency" },
]

const getOutputFileName = (originalName: string, outputFormat: OutputFormat) => {
  const nameWithoutExtension = originalName.split('.')[0]
  return `${nameWithoutExtension}.${outputFormat}`
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const HISTORY_STORAGE_KEY = 'image_converter_history'

interface StoredHistoryItem {
  id: string
  originalName: string
  convertedName: string
  originalSize: string
  convertedSize: string
  format: string
  timestamp: string
  blob?: Blob
}

export default function MultiFormatConverter() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpeg")
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const { addToast } = useToast()
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory) as StoredHistoryItem[]
          return parsedHistory.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp),
            downloadUrl: item.blob ? URL.createObjectURL(item.blob) : undefined
          }))
        } catch (e) {
          console.error('Failed to parse history from localStorage:', e)
          return []
        }
      }
    }
    return []
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const historyToStore = history.map(item => ({
        id: item.id,
        originalName: item.originalName,
        convertedName: item.convertedName,
        originalSize: item.originalSize,
        convertedSize: item.convertedSize,
        format: item.format,
        timestamp: item.timestamp.toISOString()
      }))
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyToStore))
    }
  }, [history])

  const completedFiles = selectedFiles.filter(f => f.status === "completed")

  const convertImage = useCallback(async (file: File, format: OutputFormat): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0)
        
        // Handle JPEG format specifically
        const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new blob with the correct MIME type and extension
              const convertedBlob = new Blob([blob], { 
                type: mimeType 
              })
              resolve(convertedBlob)
            } else {
              reject(new Error("Conversion failed"))
            }
          },
          mimeType,
          0.9
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Failed to load image"))
      }

      img.src = objectUrl
    })
  }, [])

  const handleFilesSelect = useCallback((files: FileList) => {
    const validFiles: FileItem[] = []

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        addToast({
          type: "error",
          title: "Oops! Wrong file type",
          description: `${file.name} isn't an image we can work with`
        })
        return
      }

      const fileItem: FileItem = {
        file,
        id: Math.random().toString(36).substring(2, 11),
        status: "pending",
        preview: URL.createObjectURL(file)
      }
      validFiles.push(fileItem)
    })

    setSelectedFiles((prev) => [...prev, ...validFiles])
    if (validFiles.length > 0) {
      addToast({
        type: "success",
        title: "Files locked and loaded!",
        description: `${validFiles.length} image${validFiles.length > 1 ? 's' : ''} ready to crush`
      })
    }
    setError(null)
  }, [addToast])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesSelect(files)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleFilesSelect(files)
      }
    },
    [handleFilesSelect],
  )

  const addToHistory = useCallback((fileItem: FileItem) => {
    if (fileItem.status !== "completed" || !fileItem.result) return

    const historyItem: HistoryItem = {
      id: fileItem.id,
      originalName: fileItem.file.name,
      convertedName: getOutputFileName(fileItem.file.name, outputFormat),
      originalSize: formatFileSize(fileItem.file.size),
      convertedSize: formatFileSize(fileItem.result.size),
      format: outputFormat.toUpperCase(),
      timestamp: new Date(),
      downloadUrl: URL.createObjectURL(fileItem.result)
    }

    setHistory(prev => [historyItem, ...prev])
  }, [outputFormat])

  const handleHistoryDownload = useCallback((item: HistoryItem) => {
    if (!item.downloadUrl) {
      setError('Download URL not available')
      return
    }

    const a = document.createElement('a')
    a.href = item.downloadUrl
    a.download = item.convertedName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const handleHistoryDelete = useCallback((id: string) => {
    setHistory(prev => {
      const itemToRemove = prev.find(item => item.id === id)
      if (itemToRemove?.downloadUrl) {
        URL.revokeObjectURL(itemToRemove.downloadUrl)
      }
      return prev.filter(item => item.id !== id)
    })
  }, [])

  const handleClearAllHistory = useCallback(() => {
    history.forEach(item => {
      if (item.downloadUrl) {
        URL.revokeObjectURL(item.downloadUrl)
      }
    })
    setHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    }
    addToast({
      type: "info",
      title: "History cleared",
      description: "All conversion history has been removed"
    })
  }, [history, addToast])

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      history.forEach(item => {
        if (item.downloadUrl) {
          URL.revokeObjectURL(item.downloadUrl)
        }
      })
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [history, selectedFiles])

  const handleConvertSingle = async (fileItem: FileItem) => {
    if (fileItem.status === "converting" || fileItem.status === "completed") return
    setError(null)

    try {
      fileItem.status = "converting"
      setSelectedFiles([...selectedFiles])

      const result = await convertImage(fileItem.file, outputFormat)
      fileItem.result = result
      fileItem.status = "completed"
      setSelectedFiles([...selectedFiles])
      addToHistory(fileItem)
      addToast({
        type: "success",
        title: "Crushed it!",
        description: `${fileItem.file.name} → ${outputFormat.toUpperCase()}`
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "conversion failed"
      fileItem.error = errorMsg
      fileItem.status = "error"
      setSelectedFiles([...selectedFiles])
      addToast({
        type: "error",
        title: "Conversion failed",
        description: `Something went wrong: ${errorMsg}`
      })
    }
  }

  const handleConvertAll = async () => {
    if (isConverting) return
    setIsConverting(true)
    setError(null)

    const updatedFiles = [...selectedFiles]
    
    for (const fileItem of updatedFiles) {
      if (fileItem.status === "completed") continue

      try {
        fileItem.status = "converting"
        setSelectedFiles([...updatedFiles])

        const result = await convertImage(fileItem.file, outputFormat)
        fileItem.result = result
        fileItem.status = "completed"
        addToHistory(fileItem)
      } catch (err) {
        fileItem.error = err instanceof Error ? err.message : "Conversion failed"
        fileItem.status = "error"
      }
      setSelectedFiles([...updatedFiles])
    }

    setIsConverting(false)
  }

  const handleDownload = async (fileItem: FileItem) => {
    if (fileItem.status !== "completed" || !fileItem.result) {
      console.error("Cannot download: file not completed or no result available")
      return
    }
    
    try {
      const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`
      const blobCopy = new Blob([fileItem.result], { type: mimeType })
      const url = URL.createObjectURL(blobCopy)
      const a = document.createElement('a')
      a.href = url
      const fileName = getOutputFileName(fileItem.file.name, outputFormat)
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
      setError("Failed to download file")
    }
  }

  const handleDownloadAll = async () => {
    if (completedFiles.length === 0) {
      console.error("No completed files to download")
      return
    }

    try {
      if (completedFiles.length > 1) {
        const JSZipModule = await import('jszip')
        const zip = new JSZipModule.default()
        
        for (const fileItem of completedFiles) {
          if (fileItem.result) {
            const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`
            const blobCopy = new Blob([fileItem.result], { type: mimeType })
            const fileName = getOutputFileName(fileItem.file.name, outputFormat)
            zip.file(fileName, blobCopy)
          }
        }

        const content = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(content)
        const a = document.createElement('a')
        a.href = url
        a.download = `converted_images.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (completedFiles.length === 1) {
        await handleDownload(completedFiles[0])
      }
    } catch (error) {
      console.error("Download all failed:", error)
      setError("Failed to process download")
    }
  }

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove?.result) {
        URL.revokeObjectURL(URL.createObjectURL(fileToRemove.result))
      }
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 p-4 lg:p-8 max-w-full overflow-hidden">
        <div className="lg:hidden mb-6 p-4 bg-orange-50 border-l-4 border-orange-300 rounded-r-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-soft flex items-center justify-center">
              <FileImage className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold text-gray-900">
                ImageCrush
              </h1>
              <p className="text-xs text-orange-soft font-medium">Compress • Convert • Conquer</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-5xl font-heading font-bold mb-2 text-gray-900">Conversion Queue</h1>
          <p className="text-gray-600 text-sm lg:text-base">Transform your images with style</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-6 text-sm lg:text-base">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-700">Files: <span className="font-bold text-gray-900">{selectedFiles.length}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Done: <span className="font-bold text-green-600">{completedFiles.length}</span></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Select value={outputFormat} onValueChange={(value: OutputFormat) => setOutputFormat(value)}>
                <SelectTrigger className="w-full sm:w-[200px] border-2 border-gray-200 hover:border-orange-300 focus:border-orange-soft">
                  {formatOptions.find(opt => opt.value === outputFormat)?.label || "Select Format"}
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{format.label}</span>
                        <span className="text-xs text-gray-500">{format.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="absolute -top-2 left-3 bg-white px-2 text-xs text-orange-soft font-medium">
                Convert to
              </div>
            </div>

            <Button
              onClick={handleConvertAll}
              disabled={isConverting || selectedFiles.length === 0}
              className="bg-orange-soft hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg border-2 border-orange-soft hover:border-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isConverting ? "Converting..." : "Convert All"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`border-3 border-dashed rounded-2xl p-6 lg:p-12 mb-6 text-center transition-all duration-300 ${
            dragActive 
              ? "border-orange-soft bg-orange-50 shadow-lg transform scale-[1.02]" 
              : "border-gray-300 hover:border-orange-300 hover:bg-orange-25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-orange-100 rounded-2xl flex items-center justify-center border-2 border-orange-200">
                <Upload className="w-10 h-10 lg:w-12 lg:h-12 text-orange-soft" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-soft rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">+</span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl lg:text-2xl font-heading font-bold text-gray-900">Drop your images here</h3>
              <p className="text-gray-600">or click below to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                variant="outline"
                className="mt-4 bg-white hover:bg-orange-50 border-2 border-orange-300 hover:border-orange-soft text-orange-soft hover:text-orange-700 font-semibold px-8 py-3 rounded-xl transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
          </div>
        </div>

        {completedFiles.length > 0 && (
          <div className="mb-6 flex justify-center">
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              className="flex items-center gap-3 bg-green-50 border-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              Download All ({completedFiles.length})
            </Button>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-xl">
            <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
              <h3 className="font-heading font-bold text-gray-900 text-xl">Your Files</h3>
              <p className="text-sm text-gray-600">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready to process</p>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {selectedFiles.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 lg:p-6 hover:bg-orange-25 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4 mb-3 sm:mb-0 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-xl bg-orange-100 border-2 border-orange-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {fileItem.preview ? (
                        <img 
                          src={fileItem.preview} 
                          alt={fileItem.file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <FileImage className="w-6 h-6 text-orange-soft" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm lg:text-base text-gray-900 truncate">
                        {fileItem.status === "completed" 
                          ? getOutputFileName(fileItem.file.name, outputFormat)
                          : fileItem.file.name}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 font-medium">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fileItem.file.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center gap-3">
                      {fileItem.status === "converting" && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-soft rounded-full animate-pulse"></div>
                          <span className="text-orange-soft text-sm font-medium">Converting...</span>
                        </div>
                      )}
                      {fileItem.status === "completed" && (
                        <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 text-sm font-semibold">Done</span>
                        </div>
                      )}
                      {fileItem.status === "error" && (
                        <div className="bg-red-100 px-3 py-1 rounded-full">
                          <span className="text-red-700 text-sm font-medium truncate max-w-[120px]">{fileItem.error}</span>
                        </div>
                      )}
                      {fileItem.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConvertSingle(fileItem)}
                          className="bg-orange-50 border-orange-300 text-orange-soft hover:bg-orange-100 hover:border-orange-soft font-semibold"
                        >
                          Convert
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {fileItem.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(fileItem)}
                          className="hover:bg-green-100 hover:text-green-600 h-9 w-9 rounded-lg"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(fileItem.id)}
                        className="hover:bg-red-100 hover:text-red-600 h-9 w-9 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {history.length > 0 && (
          <div className="xl:hidden mt-8">
            <div className="mb-4 bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
              <h2 className="text-lg font-heading font-bold text-gray-900">Recent History</h2>
              <p className="text-sm text-orange-soft font-semibold">Last {Math.min(history.length, 3)} conversions</p>
            </div>
            <div className="grid gap-4">
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all hover:shadow-lg bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate" title={item.convertedName}>
                        {item.convertedName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-green-100 hover:text-green-600 rounded-lg"
                        onClick={() => handleHistoryDownload(item)}
                        disabled={!item.downloadUrl}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg"
                        onClick={() => handleHistoryDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <div className="hidden xl:block">
        <RightPanel 
          historyItems={history}
          onDownload={handleHistoryDownload}
          onDelete={handleHistoryDelete}
          onClearAll={handleClearAllHistory}
        />
      </div>
    </div>
  )
}
