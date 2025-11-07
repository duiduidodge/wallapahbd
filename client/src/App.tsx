import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { WishForm, WishWall } from './components'

type Wish = {
  id: string
  name: string
  message: string
  createdAt: string
  imageUrl: string | null
}

type ApiWish = Omit<Wish, 'imageUrl'> & { imageUrl?: string | null }

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

const ALIASES = ['Wallapa', 'Babemild', 'My Queen', "Midday's Mommy", 'Mild'] as const

// Use fewer images for hero background to reduce DOM elements (8 total: 4 images × 2 loops)
const HERO_BG_IMAGES = [
  '/photos/bbm1.png',
  '/photos/bbm5.png',
  '/photos/bbm7.png',
  '/photos/bbm9.png'
] as const

const ALIAS_SWAP_INTERVAL = 2600
const ALIAS_FADE_DURATION = 220

const resolveImageUrl = (path?: string | null) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

const normalizeWish = (wish: ApiWish): Wish => ({
  ...wish,
  imageUrl: resolveImageUrl(wish.imageUrl ?? null)
})

function App() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aliasIndex, setAliasIndex] = useState(0)
  const [aliasVisible, setAliasVisible] = useState(true)

  useEffect(() => {
    const fetchWishes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/wishes`)
        if (!response.ok) {
          throw new Error('Unable to fetch wishes')
        }
        const data = await response.json()
        const normalized = (data.wishes ?? []).map((wish: ApiWish) => normalizeWish(wish))
        setWishes(normalized)
      } catch (err) {
        console.error(err)
        setError('โหลดบอร์ดอวยพรไม่สำเร็จ กรุณารีเฟรชหน้านี้อีกครั้งนะ')
      } finally {
        setLoading(false)
      }
    }

    fetchWishes()
  }, [])

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined
    const timer = setInterval(() => {
      setAliasVisible(false)
      fadeTimeout = setTimeout(() => {
        setAliasIndex((prev) => (prev + 1) % ALIASES.length)
        setAliasVisible(true)
      }, ALIAS_FADE_DURATION)
    }, ALIAS_SWAP_INTERVAL)

    return () => {
      clearInterval(timer)
      if (fadeTimeout) {
        clearTimeout(fadeTimeout)
      }
    }
  }, [])

  const wishCountMessage = useMemo(() => {
    if (!wishes.length) {
      return 'มาเป็นคนแรกที่ฝากคำอวยพรให้วาลภานะ'
    }
    if (wishes.length === 1) {
      return 'ตอนนี้มี 1 ข้อความมาร่วมฉลองแล้ว'
    }
    return `ตอนนี้มี ${wishes.length} ข้อความร่วมอวยพรแล้ว`
  }, [wishes.length])

  const handleWishAdded = (newWish: ApiWish) => {
    const normalized = normalizeWish(newWish)
    setWishes((prev) => [normalized, ...prev])
  }

  const scrollToWishForm = () => {
    const wishFormElement = document.querySelector('.wish-form')
    if (wishFormElement) {
      wishFormElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <>
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg-track hero-bg-track-primary">
          {[0, 1].map((loop) =>
            HERO_BG_IMAGES.map((src) => (
              <img
                key={`${loop}-${src}`}
                src={src}
                alt=""
                loading="lazy"
                role="presentation"
                decoding="async"
              />
            ))
          )}
        </div>
        <div className="hero-bg-track hero-bg-track-secondary">
          {[0, 1].map((loop) =>
            HERO_BG_IMAGES.map((src) => (
              <img
                key={`secondary-${loop}-${src}`}
                src={src}
                alt=""
                loading="lazy"
                role="presentation"
                decoding="async"
              />
            ))
          )}
        </div>
      </div>

      <div className="app-shell">
        <header className="hero">
          <p className="eyebrow">วันนี้เป็นวันพิเศษของวาลภา</p>
          <h1>
            Happy Birthday
            <span className="alias-line">
              <span className={`alias${aliasVisible ? '' : ' alias-hidden'}`}>
                {ALIASES[aliasIndex]}
              </span>
            </span>
          </h1>
          <p className="subheadline">
            เชิญเพื่อนและครอบครัวทุกคนมาร่วมเขียนข้อความสั้นๆ ให้มายด์ได้ตามสะดวก เติมเต็มวันเกิดให้ชุ่มฉ่ำด้วยคำพูดอบอุ่นจากทุกคน
          </p>
          <p className="meta">{wishCountMessage}</p>
          <button className="hero-cta" onClick={scrollToWishForm}>
            ฝากคำอวยพร
          </button>
        </header>

        <WishWall wishes={wishes} loading={loading} />

        <WishForm onWishAdded={handleWishAdded} apiBaseUrl={API_BASE_URL} />

        {error && (
          <p className="status error" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  )
}

export default App
