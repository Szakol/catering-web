import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { api } from '../api/client'
import type { MenuItem } from '../api/types'
import HeroCarousel from '../components/HeroCarousel'
import { BOX_MAX_ITEMS, BOX_MIN_ITEMS } from '../config'
import { about, faq, occasions, site, steps } from '../content'
import { formatPrice } from '../utils/format'

const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.5 },
}

export default function HomePage() {
    const [menu, setMenu] = useState<MenuItem[]>([])

    useEffect(() => {
        // jeśli backend nie odpowie, sekcja menu po prostu się nie pokaże
        api.getMenu().then(setMenu).catch(() => setMenu([]))
    }, [])

    return (
        <>
            {/* Hero */}
            <section className="bg-brand-300">
                <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2">
                    <div className="text-center md:text-left">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl"
                        >
                            Catering okolicznościowy, który składasz sam
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="mt-5 text-lg text-brand-900/80"
                        >
                            {site.tagline}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
                        >
                            <Link to="/zamow" className="btn-light">
                                Skomponuj box
                            </Link>
                            <a href="#menu" className="btn-secondary">
                                Zobacz menu
                            </a>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7 }}
                    >
                        <HeroCarousel />
                    </motion.div>
                </div>
            </section>

            {/* Jak to działa */}
            <section className="mx-auto max-w-6xl px-4 py-16">
                <motion.h2 {...fadeUp} className="text-center text-3xl font-bold text-stone-900">
                    Jak to działa
                </motion.h2>
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.title}
                            {...fadeUp}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="rounded-2xl bg-white p-6 shadow-sm"
                        >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                {i + 1}
              </span>
                            <h3 className="mt-4 text-xl font-semibold text-stone-900">{step.title}</h3>
                            <p className="mt-2 text-stone-600">{step.text}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Menu */}
            {menu.length > 0 && (
                <section id="menu" className="bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-16">
                        <motion.h2 {...fadeUp} className="text-center text-3xl font-bold text-stone-900">
                            Z czego skomponujesz box
                        </motion.h2>
                        <p className="mx-auto mt-3 max-w-2xl text-center text-stone-600">
                            Wybierasz {BOX_MIN_ITEMS} lub {BOX_MAX_ITEMS} pozycji. Cena boxa to suma cen wybranych potraw.
                        </p>
                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {menu.map((item) => (
                                <motion.div
                                    key={item.id}
                                    {...fadeUp}
                                    className="rounded-2xl border border-stone-200 bg-brand-50 p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-lg font-semibold text-stone-900">{item.name}</h3>
                                        <span className="shrink-0 font-medium text-brand-700">{formatPrice(item.price)}</span>
                                    </div>
                                    {item.description && <p className="mt-2 text-sm text-stone-600">{item.description}</p>}
                                </motion.div>
                            ))}
                        </div>
                        <div className="mt-10 text-center">
                            <Link to="/zamow" className="btn-primary">
                                Przejdź do składania boxa
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Okazje */}
            <section className="mx-auto max-w-6xl px-4 py-16">
                <motion.h2 {...fadeUp} className="text-center text-3xl font-bold text-stone-900">
                    Na każdą okazję
                </motion.h2>
                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    {occasions.map((o, i) => (
                        <motion.div
                            key={o.title}
                            {...fadeUp}
                            transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
                            className="rounded-2xl bg-brand-100 p-6"
                        >
                            <h3 className="text-xl font-semibold text-stone-900">{o.title}</h3>
                            <p className="mt-2 text-stone-700">{o.text}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* O nas */}
            <section className="bg-white">
                <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
                    <motion.div {...fadeUp} className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-brand-300 shadow-lg">
                        <img src="/logo.png" alt="Na Piątkę catering" className="w-full" />
                    </motion.div>
                    <motion.div {...fadeUp}>
                        <h2 className="text-3xl font-bold text-stone-900">{about.title}</h2>
                        <div className="mt-4 space-y-3 text-stone-700">
                            {about.paragraphs.map((p) => (
                                <p key={p}>{p}</p>
                            ))}
                        </div>
                        <Link to="/zamow" className="btn-primary mt-6">
                            Skomponuj swój box
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-brand-50">
                <div className="mx-auto max-w-3xl px-4 py-16">
                    <motion.h2 {...fadeUp} className="text-center text-3xl font-bold text-stone-900">
                        Najczęstsze pytania
                    </motion.h2>
                    <div className="mt-8 space-y-3">
                        {faq.map((item) => (
                            <details key={item.q} className="group rounded-xl border border-stone-200 bg-white p-4">
                                <summary className="cursor-pointer list-none font-semibold text-stone-900 marker:hidden">
                                    <span className="mr-2 inline-block text-brand-600 transition group-open:rotate-90">›</span>
                                    {item.q}
                                </summary>
                                <p className="mt-3 text-stone-600">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Końcowe wezwanie */}
            <section className="bg-brand-300">
                <div className="mx-auto max-w-4xl px-4 py-14 text-center">
                    <h2 className="text-3xl font-bold text-brand-900">Gotowy na swój box?</h2>
                    <p className="mt-2 text-brand-900/80">Zajmie to kilka minut, a cenę zobaczysz od razu.</p>
                    <Link to="/zamow" className="btn-light mt-6">
                        Skomponuj box
                    </Link>
                </div>
            </section>
        </>
    )
}