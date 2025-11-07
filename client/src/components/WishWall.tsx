import { memo } from 'react'

interface Wish {
  id: string
  name: string
  message: string
  createdAt: string
  imageUrl: string | null
}

interface WishWallProps {
  wishes: Wish[]
  loading: boolean
}

const readableDate = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

export const WishWall = memo(({ wishes, loading }: WishWallProps) => {

  return (
    <section className="card wish-wall">
      <div className="wall-header">
        <h2>บอร์ดคำอวยพร</h2>
        {!loading && <span>{wishes.length} ข้อความ</span>}
      </div>

      {loading ? (
        <div className="showcase-wrapper">
          <ul>
            {[...Array(6)].map((_, i) => (
              <li key={i} className="skeleton-card">
                <div className="skeleton-header">
                  <div className="skeleton skeleton-name"></div>
                  <div className="skeleton skeleton-time"></div>
                </div>
                <div className="skeleton skeleton-message"></div>
              </li>
            ))}
          </ul>
        </div>
      ) : wishes.length === 0 ? (
        <div className="empty-wall">
          ผนังยังว่างอยู่เลย ฝากข้อความแรกให้หน่อยนะ!
        </div>
      ) : (
        <div className="showcase-wrapper">
          <ul key={wishes.length}>
            {wishes.map((wish) => (
              <li key={wish.id} className="wish-card">
                <div className="wish-header">
                  <strong>{wish.name}</strong>
                  <time dateTime={wish.createdAt}>{readableDate(wish.createdAt)}</time>
                </div>
                {wish.imageUrl && (
                  <img
                    src={wish.imageUrl}
                    alt={`รูปประกอบจาก ${wish.name}`}
                    className="wish-image"
                    loading="lazy"
                  />
                )}
                <p>{wish.message}</p>
              </li>
            ))}
            {wishes.map((wish) => (
              <li key={`duplicate-${wish.id}`} className="wish-card">
                <div className="wish-header">
                  <strong>{wish.name}</strong>
                  <time dateTime={wish.createdAt}>{readableDate(wish.createdAt)}</time>
                </div>
                {wish.imageUrl && (
                  <img
                    src={wish.imageUrl}
                    alt={`รูปประกอบจาก ${wish.name}`}
                    className="wish-image"
                    loading="lazy"
                  />
                )}
                <p>{wish.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
})

WishWall.displayName = 'WishWall'
