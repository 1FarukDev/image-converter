"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, ImageIcon, AlertCircle, X, FileImage, Trash2 } from "lucide-react"


interface ConversionResult {
  blob: Blob
  url: string
  originalSize: number
  convertedSize: number
  compressionRatio: number
  fileName: string
}

interface FileItem {
  file: File
  id: string
  status: "pending" | "converting" | "completed" | "error"
  result?: ConversionResult
  error?: string
  progress: number
}

type OutputFormat = "webp" | "avif" | "jpeg" | "png"

const formatOptions = [
  { value: "webp" as OutputFormat, label: "WebP", description: "Best compression, wide support" },
  { value: "avif" as OutputFormat, label: "AVIF", description: "Superior compression, modern browsers" },
  { value: "jpeg" as OutputFormat, label: "JPEG", description: "Universal support, good for photos" },
  { value: "png" as OutputFormat, label: "PNG", description: "Lossless, supports transparency" },
]

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

  const convertImage = useCallback(async (file: File, format: OutputFormat): Promise<ConversionResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = () => {
        img.src = reader.result as string
      }

      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        img.crossOrigin = "anonymous"
        ctx.drawImage(img, 0, 0)

        const mimeType = `image/${format}`
        const quality = format === "png" ? undefined : 0.9

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const compressionRatio = ((file.size - blob.size) / file.size) * 100
              const fileName = `${file.name.split(".")[0]}.${format}`
              resolve({
                blob,
                url,
                originalSize: file.size,
                convertedSize: blob.size,
                compressionRatio: Math.max(0, compressionRatio),
                fileName,
              })
            } else {
              reject(new Error("Conversion failed"))
            }
          },
          mimeType,
          quality,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
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
        progress: 0,
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
    if (selectedFiles.length === 0) return

    setIsConverting(true)
    setError(null)

    const updatedFiles = [...selectedFiles]

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileItem = updatedFiles[i]

      if (fileItem.status === "completed") continue

      // Update status to converting
      fileItem.status = "converting"
      fileItem.progress = 0
      setSelectedFiles([...updatedFiles])

      // Simulate progress
      const progressInterval = setInterval(() => {
        fileItem.progress = Math.min(fileItem.progress + 10, 90)
        setSelectedFiles([...updatedFiles])
      }, 100)

      try {
        const result = await convertImage(fileItem.file, outputFormat)
        fileItem.result = result
        fileItem.status = "completed"
        fileItem.progress = 100
      } catch (err) {
        fileItem.error = err instanceof Error ? err.message : "Conversion failed"
        fileItem.status = "error"
        fileItem.progress = 0
      } finally {
        clearInterval(progressInterval)
        setSelectedFiles([...updatedFiles])
      }
    }

    setIsConverting(false)
  }

  const handleDownload = (fileItem: FileItem) => {
    if (!fileItem.result) return

    const link = document.createElement("a")
    link.href = fileItem.result.url
    link.download = fileItem.result.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = () => {
    selectedFiles.forEach((fileItem) => {
      if (fileItem.result) {
        setTimeout(() => handleDownload(fileItem), 100)
      }
    })
  }

  const resetConverter = () => {
    setSelectedFiles([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const completedFiles = selectedFiles.filter((f) => f.status === "completed")
  const totalSavings = completedFiles.reduce((acc, f) => acc + (f.result?.compressionRatio || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Multi-Format Image Converter</h1>
          <p className="text-lg text-gray-600">Convert your images to WebP, AVIF, JPEG, or PNG format</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Upload Images
              </CardTitle>
              <CardDescription>Select multiple image files or drag and drop them here</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-input"
                />

                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <label
                      htmlFor="file-input"
                      className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Click to upload
                    </label>
                    <span className="text-gray-600"> or drag and drop</span>
                  </div>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Output Format</CardTitle>
              <CardDescription>Choose the format to convert your images to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={outputFormat} onValueChange={(value: OutputFormat) => setOutputFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
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

              {selectedFiles.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Files selected:</span>
                      <span className="font-medium">{selectedFiles.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium text-green-600">{completedFiles.length}</span>
                    </div>
                    {completedFiles.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Avg. savings:</span>
                        <span className="font-medium text-green-600">
                          {(totalSavings / completedFiles.length).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConvertAll}
                      disabled={isConverting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isConverting ? "Converting..." : `Convert All to ${outputFormat.toUpperCase()}`}
                    </Button>
                    <Button variant="outline" size="icon" onClick={resetConverter}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {selectedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conversion Queue</CardTitle>
                  <CardDescription>Track the progress of your image conversions</CardDescription>
                </div>
                {completedFiles.length > 0 && (
                  <Button onClick={handleDownloadAll} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download All ({completedFiles.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedFiles.map((fileItem) => (
                  <div key={fileItem.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <FileImage className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{fileItem.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileItem.status === "completed" && fileItem.result && (
                          <>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              -{fileItem.result.compressionRatio.toFixed(1)}%
                            </Badge>
                            <Button size="sm" onClick={() => handleDownload(fileItem)}>
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </>
                        )}
                        {fileItem.status === "error" && <Badge variant="destructive">Error</Badge>}
                        {fileItem.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => removeFile(fileItem.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {fileItem.status === "converting" && (
                      <div className="space-y-2">
                        <Progress value={fileItem.progress} className="w-full" />
                        <p className="text-xs text-center text-gray-600">Converting...</p>
                      </div>
                    )}

                    {fileItem.status === "completed" && fileItem.result && (
                      <div className="mt-3 flex justify-center">
                        <img
                          src={fileItem.result.url || "/placeholder.svg"}
                          alt={`Converted ${fileItem.file.name}`}
                          className="max-w-32 max-h-32 rounded border object-cover"
                        />
                      </div>
                    )}

                    {fileItem.status === "error" && <p className="text-sm text-red-600 mt-2">{fileItem.error}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
