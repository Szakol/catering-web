import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { heroSlides } from '../content'

const INTERVAL_MS = 5000

export default function HeroCarousel() {
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const reduceMotion = useReducedMotion()
    const count = heroSlides.length

    useEffect(() => {
        if (count < 2 || paused || reduceMotion) return
        const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
        return () => clearInterval(timer)
    }, [count, paused, reduceMotion])

    // brak zdjęć: pokazujemy logo
    if (count === 0) {
        return <img src="/logo.png" alt="Catering Na Piątkę: box z przekąskami" className="mx-auto w-full max-w-md" />
    }

    const slide = heroSlides[index % count]

    return (
        <div
            className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl bg-brand-200 shadow-xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <AnimatePresence initial={false}>
                <motion.img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.8 }}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </AnimatePresence>

            {slide.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-4 pt-10">
                    <p className="text-sm font-medium text-white">{slide.caption}</p>
                </div>
            )}

            {count > 1 && (
                <div className="absolute bottom-3 right-4 flex gap-2">
                    {heroSlides.map((s, i) => (
                        <button
                            key={s.src}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`Pokaż zdjęcie ${i + 1}`}
                            aria-current={i === index % count}
                            className={[
                                'h-2.5 rounded-full transition-all',
                                i === index % count ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80',
                            ].join(' ')}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}