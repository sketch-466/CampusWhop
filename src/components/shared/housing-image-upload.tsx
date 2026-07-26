'use client'

import { useState, useRef } from 'react'

type HousingImageUploadProps = {
  value: string[]
  onChange: (urls: string[]) => void
  error?: string
}

export function HousingImageUpload({ value, onChange, error }: HousingImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    if (value.length >= 6) {
      setUploadError('Maximum 6 images allowed')
      return
    }

    const remaining = 6 - value.length
    const selected = Array.from(files).slice(0, remaining)

    setUploading(true)
    setUploadError(null)

    const uploaded: string[] = []

    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError('Only JPG, PNG and WebP images are allowed')
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Each image must be under 5MB')
        continue
      }

      try {
        const formData = new FormData()
        formData.append('image', file)

        const res = await fetch('/api/upload/housing', {
          method: 'POST',
          body: formData,
        })

        const result = await res.json()

        if (!res.ok || result.error) {
          setUploadError(result.error ?? 'Upload failed')
          continue
        }

        uploaded.push(result.url)
      } catch {
        setUploadError('Upload failed')
        continue
      }
    }

    onChange([...value, ...uploaded])
    setUploading(false)
  }

  function removeImage(url: string) {
    onChange(value.filter((u) => u !== url))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {value.map((url) => (
          <div key={url} className="relative aspect-square">
            <img
              src={url}
              alt="Upload preview"
              className="h-full w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}

        {value.length < 6 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-800 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-xs">Uploading...</span>
            ) : (
              <>
                <span className="text-2xl">+</span>
                <span className="text-xs">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <p className="text-xs text-zinc-500">
        {value.length}/6 photos · JPG, PNG or WebP · Max 5MB each
      </p>

      {(error || uploadError) && (
        <p className="text-xs text-red-400">{error ?? uploadError}</p>
      )}
    </div>
  )
}