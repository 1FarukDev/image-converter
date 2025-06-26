"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Upload, Download, AlertCircle, X, FileImage, Check } from "lucide-react"
import { Sidebar } from "@/components/ui/sidebar"
import { RightPanel } from "@/components/ui/right-panel"

interface FileItem {
  id: string
  file: File
  status: "pending" | "converting" | "completed" | "error"
  result?: Blob
  error?: string
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

export default function MultiFormatConverter() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpeg")
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setError(`${file.name} is not a valid image file`)
        return
      }

      const fileItem: FileItem = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending",
      }
      validFiles.push(fileItem)
    })

    setSelectedFiles((prev) => [...prev, ...validFiles])
    setError(null)
  }, [])

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

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove?.result) {
        URL.revokeObjectURL(URL.createObjectURL(fileToRemove.result))
      }
      return prev.filter(f => f.id !== id)
    })
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

  const handleConvertSingle = async (fileItem: FileItem) => {
    if (fileItem.status === "converting" || fileItem.status === "completed") return
    setError(null)

    try {
      fileItem.status = "converting"
      setSelectedFiles([...selectedFiles])

      const result = await convertImage(fileItem.file, outputFormat)
      fileItem.result = result
      fileItem.status = "completed"
    } catch (err) {
      fileItem.error = err instanceof Error ? err.message : "Conversion failed"
      fileItem.status = "error"
    }
    setSelectedFiles([...selectedFiles])
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        userName="Guest User"
        userEmail="guest@example.com"
        conversionsLeft={5}
        totalConversions={20}
      />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Conversion Queue</h1>
          <p className="text-gray-500">Track the progress of your image conversions</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-gray-600">
              Files: <span className="font-semibold">{selectedFiles.length}</span>
            </div>
            <div className="text-gray-600">
              Completed: <span className="font-semibold text-green-600">{completedFiles.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={outputFormat} onValueChange={(value: OutputFormat) => setOutputFormat(value)}>
              <SelectTrigger className="w-[180px]">
                {formatOptions.find(opt => opt.value === outputFormat)?.label || "Select format"}
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleConvertAll}
              disabled={isConverting || selectedFiles.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
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
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-xl font-semibold mb-2">Drop your images here</p>
              <p className="text-gray-500">or</p>
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
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <Card className="overflow-hidden">
            <div className="divide-y">
              {selectedFiles.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileImage className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium">
                        {fileItem.status === "completed" 
                          ? getOutputFileName(fileItem.file.name, outputFormat)
                          : fileItem.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {fileItem.status === "converting" && (
                      <div className="text-blue-600">Converting...</div>
                    )}
                    {fileItem.status === "completed" && (
                      <>
                        <Check className="w-5 h-5 text-green-600" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(fileItem)}
                          className="hover:bg-gray-100"
                        >
                          <Download className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                    {fileItem.status === "error" && (
                      <div className="text-red-600">{fileItem.error}</div>
                    )}
                    {fileItem.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConvertSingle(fileItem)}
                        className="mr-2"
                      >
                        Convert
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(fileItem.id)}
                      className="hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {completedFiles.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              className="flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download All
            </Button>
          </div>
        )}
      </main>
      <RightPanel />
    </div>
  )
}
