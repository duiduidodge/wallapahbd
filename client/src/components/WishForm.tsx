import { useState, useRef, memo } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

const MAX_NAME_LENGTH = 60
const MAX_MESSAGE_LENGTH = 500
const MAX_IMAGE_SIZE_MB = 2
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface WishFormProps {
  onWishAdded: (wish: any) => void
  apiBaseUrl: string
}

export const WishForm = memo(({ onWishAdded, apiBaseUrl }: WishFormProps) => {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formState, setFormState] = useState({ name: '', message: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setUploadError(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP นะ')
      setSelectedFile(null)
      resetFileInput()
      return
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setUploadError(`ไฟล์ต้องไม่เกิน ${MAX_IMAGE_SIZE_MB}MB`)
      setSelectedFile(null)
      resetFileInput()
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setUploadError(null)
    resetFileInput()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setUploadError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append('name', formState.name.trim())
      formData.append('message', formState.message.trim())
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(`${apiBaseUrl}/api/wishes`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error ?? 'ส่งคำอวยพรไม่สำเร็จ กรุณาลองใหม่')
      }

      onWishAdded(payload.wish)
      setFormState({ name: '', message: '' })
      handleRemoveImage()
      setSuccessMessage('ขอบคุณ! เราโพสต์คำอวยพรของคุณเรียบร้อยแล้ว')
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        setSuccessMessage(null)
      }, 5000)
    } catch (err) {
      console.error(err)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('คำขอใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง')
      } else {
        setError(
          err instanceof Error ? err.message : 'ส่งคำอวยพรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
        )
      }
      // Auto-clear error after 8 seconds
      setTimeout(() => setError(null), 8000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card wish-form" style={{ position: 'relative', overflow: 'visible' }}>
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#b56fb1', '#f3d2e5', '#efd7e8', '#e2c4d9', '#7a4e7f'][
                  Math.floor(Math.random() * 5)
                ]
              }}
            />
          ))}
        </div>
      )}
      <h2>ฝากคำอวยพร</h2>
      <form onSubmit={handleSubmit}>
        <label>
          ชื่อของคุณ
          <input
            name="name"
            type="text"
            maxLength={MAX_NAME_LENGTH}
            placeholder="เช่น มิดเดย์ เพื่อนสมัยเรียนระยอง"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                name: event.target.value
              }))
            }
            required
          />
          <p className="field-hint">
            {formState.name.length}/{MAX_NAME_LENGTH} ตัวอักษร
          </p>
        </label>

        <label>
          ข้อความ
          <textarea
            name="message"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            placeholder="บอกให้วาลภารู้ว่าเธอพิเศษแค่ไหน"
            value={formState.message}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                message: event.target.value
              }))
            }
            required
          />
          <p className="field-hint">
            {formState.message.length}/{MAX_MESSAGE_LENGTH} ตัวอักษร
          </p>
        </label>

        <div className="image-upload">
          <div>
            <p className="image-upload-title">แนบรูปประกอบ (ไม่บังคับ)</p>
            <p className="field-hint">
              รองรับ JPG, PNG, WEBP • ไม่เกิน {MAX_IMAGE_SIZE_MB}MB
            </p>
          </div>
          <label className="image-dropzone">
            <input
              type="file"
              name="image"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <span>{selectedFile ? 'เปลี่ยนรูป' : 'เลือกหรือวางรูปได้เลย'}</span>
          </label>

          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="ตัวอย่างรูปคำอวยพร" />
              <button type="button" onClick={handleRemoveImage}>
                ลบรูป
              </button>
            </div>
          )}

          {uploadError && <p className="status error">{uploadError}</p>}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'กำลังส่ง...' : 'ส่งคำอวยพร'}
        </button>
      </form>
      {error && (
        <p className="status error" role="status" aria-live="polite">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="status success" role="status" aria-live="polite">
          {successMessage}
        </p>
      )}
    </section>
  )
})

WishForm.displayName = 'WishForm'
