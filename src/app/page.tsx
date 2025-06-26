"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Upload, Download, AlertCircle, X, FileImage, MoreVertical, Check } from "lucide-react"
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

const dummyHistoryItems = [
  { name: "Illustr_3485.jpg", size: "3.5 Mb", type: "jpg" as const },
  { name: "img2045.png", size: "2.1 Mb", type: "png" as const },
  { name: "icon24.svg", size: "258 Kb", type: "svg" as const },
  { name: "article.doc", size: "459 Kb", type: "doc" as const },
  { name: "present19.pdf", size: "3.5 Mb", type: "pdf" as const },
  { name: "photo1.jpg", size: "7.8 Mb", type: "jpg" as const },
]

const formatOptions = [
  { value: "webp" as OutputFormat, label: "WebP", description: "Best compression, wide support" },
  { value: "avif" as OutputFormat, label: "AVIF", description: "Superior compression, modern browsers" },
  { value: "jpeg" as OutputFormat, label: "JPEG", description: "Universal support, good for photos" },
  { value: "png" as OutputFormat, label: "PNG", description: "Lossless, supports transparency" },
]

const getOutputFileName = (originalName: string, outputFormat: OutputFormat) => {
  const nameWithoutExtension = originalName.split('.')[0]
  return `${nameWithoutExtension}.${outputFormat.toLowerCase()}`
}

export default function MultiFormatConverter() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp")
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

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
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Conversion failed"))
            }
          },
          `image/${format}`,
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
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id))
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
      const blobCopy = new Blob([fileItem.result], { type: `image/${outputFormat}` })
      const url = URL.createObjectURL(blobCopy)
      const a = document.createElement('a')
      a.href = url
      a.download = getOutputFileName(fileItem.file.name, outputFormat)
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
            const blobCopy = new Blob([fileItem.result], { type: `image/${outputFormat}` })
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        userName="Thea Murray"
        userEmail="murray86@gmail.com"
        conversionsLeft={5}
        totalConversions={20}
      />

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold">Convert JPG to PDF</h1>
                <button className="text-gray-500 hover:text-gray-700">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg transition-colors mb-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 ${
                  dragActive 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-blue-300 bg-blue-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="py-12 px-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-input"
                  />
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-700 mb-2">
                      Click or drag your files here to convert
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversion Queue */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  {/* Queue Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium">Conversion Queue</h2>
                      <p className="text-sm text-gray-500">Track the progress of your image conversions</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Files:</span>
                          <span className="font-medium">{selectedFiles.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium text-green-600">{completedFiles.length}</span>
                        </div>
                      </div>
                      <div>
                        <Select value={outputFormat} onValueChange={(value: OutputFormat) => setOutputFormat(value)}>
                          <SelectTrigger className="w-[200px] bg-white text-lg">
                            <div className="font-medium">
                              {formatOptions.find(f => f.value === outputFormat)?.label}
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {formatOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-gray-500">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleConvertAll}
                        disabled={isConverting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Convert All
                      </Button>
                    </div>
                  </div>

                  {/* File List */}
                  {selectedFiles.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileImage className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {getOutputFileName(fileItem.file.name, outputFormat)}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {fileItem.status === "completed" && (
                          <>
                            <span className="text-green-600 flex items-center gap-1">
                              <Check className="h-4 w-4" />
                              Converted
                            </span>
                            <button
                              onClick={() => handleDownload(fileItem)}
                              className="p-2 hover:bg-gray-100 rounded-full"
                            >
                              <Download className="h-5 w-5 text-gray-600" />
                            </button>
                          </>
                        )}
                        {fileItem.status === "converting" && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Converting...
                          </div>
                        )}
                        {fileItem.status === "pending" && (
                          <button
                            onClick={() => removeFile(fileItem.id)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-500">
                      {completedFiles.length} of {selectedFiles.length} files completed
                    </p>
                    <Button
                      onClick={handleDownloadAll}
                      disabled={completedFiles.length === 0}
                      className="bg-black text-white hover:bg-gray-900 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download All
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </div>
      </main>

      <RightPanel historyItems={dummyHistoryItems} />
    </div>
  )
}
