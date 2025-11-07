import { memo, useMemo } from 'react'

interface Wish {
  id: string
  name: string
  message: string
  createdAt: string
  imageUrl: string | null
}

interface HeroStatsProps {
  wishes: Wish[]
}

export const HeroStats = memo(({ wishes }: HeroStatsProps) => {
  const wishesToday = useMemo(() => {
    const today = new Date().toDateString()
    return wishes.filter((wish) => new Date(wish.createdAt).toDateString() === today)
      .length
  }, [wishes])

  const latestWish = wishes[0]
  const latestWishPreview = latestWish
    ? `${latestWish.message.slice(0, 110)}${
        latestWish.message.length > 110 ? '...' : ''
      }`
    : 'ยังไม่มีคำอวยพร ลองฝากข้อความแรกดูสิ'

  return (
    <section className="hero-stats">
      <article className="stat-card">
        <p className="stat-label">ข้อความทั้งหมด</p>
        <p className="stat-value">{wishes.length}</p>
        <p className="stat-note">เพื่อนๆ ฝากความรักไว้ตรงนี้</p>
      </article>
      <article className="stat-card">
        <p className="stat-label">ข้อความวันนี้</p>
        <p className="stat-value">{wishesToday}</p>
        <p className="stat-note">สดใหม่ในวันเกิดนี้</p>
      </article>
      <article className="stat-card highlight">
        <p className="stat-label">ข้อความล่าสุด</p>
        <p className="stat-latest">
          {latestWish ? (
            <>
              <strong>{latestWish.name}</strong> — {latestWishPreview}
            </>
          ) : (
            'ยังไม่มีข้อความเลย'
          )}
        </p>
        {latestWish?.imageUrl && (
          <img
            src={latestWish.imageUrl}
            alt={`รูปประกอบจาก ${latestWish.name}`}
            className="stat-preview"
            loading="lazy"
          />
        )}
      </article>
    </section>
  )
})

HeroStats.displayName = 'HeroStats'
