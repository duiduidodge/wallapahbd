import { memo } from 'react'

const GALLERY_IMAGES = [
  { src: '/photos/bbm1.png', caption: 'รอยยิ้มสดใสในทริปทะเล' },
  { src: '/photos/bbm2.png', caption: 'ช่วงเวลาพักผ่อนช่วงบ่าย' },
  { src: '/photos/bbm4.png', caption: 'เดินเล่นกลางเมือง' },
  { src: '/photos/bbm5.png', caption: 'มุมโปรดในคาเฟ่' },
  { src: '/photos/bbm6.png', caption: 'สายลมเย็นและเธอ' },
  { src: '/photos/bbm7.png', caption: 'นาทีแห่งความสุข' },
  { src: '/photos/bbm8.png', caption: 'หยอกล้อกับลมทะเล' },
  { src: '/photos/bbm9.png', caption: 'สายตาที่เต็มไปด้วยความรัก' },
  { src: '/photos/bbm10.png', caption: 'แดดอุ่นๆ ยามบ่าย' }
] as const

export const PhotoGallery = memo(() => {
  return (
    <section className="photo-gallery">
      <div className="gallery-header">
        <p className="eyebrow">Moments with Wallapa</p>
        <h2>อัลบั้มเล็กๆ ที่เต็มไปด้วยความทรงจำแสนหวาน</h2>
        <p className="subheadline">
          เลือกมา 9 รูปที่บันทึกความอ่อนโยนของเธอในหลายๆ ช่วงเวลา ใช้เป็นแรงบันดาลใจ
          ในการเขียนข้อความให้ Wallapa ได้เลย
        </p>
      </div>
      <div className="gallery-grid">
        {GALLERY_IMAGES.map((photo, index) => (
          <figure key={photo.src} className={`gallery-card tilt-${index % 4}`}>
            <img src={photo.src} alt={photo.caption} loading="lazy" />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
})

PhotoGallery.displayName = 'PhotoGallery'
