import { MIN_DAYS_AHEAD, PICKUP_FROM, PICKUP_TO } from './config'

export const site = {
    name: 'Catering Na Piątkę',
    tagline: 'Catering na każdą okazję. Skomponuj swój box z tego, co lubisz.',
    contact: {
        phone: '+48 798 223 774',
        email: 'paulina72726@gmail.com',
        city: 'Zblewo',
    },
    /** Krótka informacja o miejscu odbioru, pokazywana w konfiguratorze, koszyku i formularzu */
    pickupInfo: `Odbiór osobisty w miejscowości Zblewo, ${PICKUP_FROM}–${PICKUP_TO}`,
}

export interface HeroSlide {
    src: string
    alt: string
    caption?: string
}

// Zdjęcia gotowych boxów w hero. Pliki leżą w public/boxes/.
// Aby podmienić lub dodać zdjęcie, wrzuć plik do tego folderu i dopisz wpis poniżej.
// Przy pustej liście w hero pokazuje się logo.
export const heroSlides: HeroSlide[] = [
    { src: '/boxes/box-1.jpg', alt: 'Box na urodziny', caption: 'Box urodzinowy' },
    { src: '/boxes/box-2.jpg', alt: 'Box na spotkanie firmowe', caption: 'Box na spotkanie firmowe' },
    { src: '/boxes/box-3.jpg', alt: 'Box na imprezę rodzinną', caption: 'Box na imprezę rodzinną' },
]

export const about = {
    title: 'Poznaj Catering Na Piątkę',
    paragraphs: [
        // TODO: kilka zdań od właścicielki: kim jest, skąd pomysł na catering w boxach, czym się wyróżnia
        'Tu pojawi się kilka zdań o firmie.',
    ],
}

export const steps = [
    {
        title: 'Wybierz potrawy',
        text: 'Skomponuj box z naszego menu. Zawsze od 5 do 6 pozycji, tak jak lubisz.',
    },
    {
        title: 'Zobacz cenę od razu',
        text: 'Cena boxa aktualizuje się na bieżąco, więc zawsze wiesz, ile zapłacisz.',
    },
    {
        title: 'Zamów i odbierz',
        text: 'Podaj termin i dane kontaktowe. O statusie zamówienia poinformujemy Cię SMS-em.',
    },
]

export const occasions = [
    { title: 'Urodziny', text: 'Przekąski i dania, które znikają ze stołu pierwsze.' },
    { title: 'Spotkania firmowe', text: 'Wygodne boxy dla zespołu, bez gotowania i zmywania.' },
    { title: 'Imprezy rodzinne', text: 'Chrzciny, komunie, rocznice: zamów tyle boxów, ilu masz gości.' },
    { title: 'Wieczór ze znajomymi', text: 'Mecz, planszówki, film. Box na dwie, cztery lub dziesięć osób.' },
]

export const faq = [
    {
        q: 'Jak wygląda box?',
        a: 'Każdy box składa się z 5 lub 6 wybranych przez Ciebie potraw z aktualnego menu. Możesz zamówić kilka boxów w różnych konfiguracjach.',
    },
    {
        q: 'Jak mogę zapłacić?',
        a: 'Płatność BLIK-iem na telefon albo przelewem. Po zaksięgowaniu wpłaty potwierdzimy ją SMS-em.',
    },
    {
        q: 'Czy jest dostawa?',
        a: 'Na razie zamówienia odbierasz osobiście w miejscowości Zblewo. Dostawę do domu planujemy dodać w przyszłości.',
    },
    {
        q: 'Jak wcześnie trzeba zamawiać?',
        a: `Zamówienie składasz z minimum ${MIN_DAYS_AHEAD} dniami wyprzedzenia. Podejście jest indywidualne do każdego zamówienia, więc potrzebujemy czasu, żeby je dobrze przygotować.`,
    },
    {
        q: 'W jakich godzinach mogę odebrać zamówienie?',
        a: `Odbiór w Zblewie jest możliwy w godzinach ${PICKUP_FROM}–${PICKUP_TO}.`,
    },
    {
        q: 'Co z alergenami?',
        a: 'Potrzebujesz informacji o składnikach lub masz alergię? Napisz w uwagach do zamówienia albo skontaktuj się z nami przed złożeniem zamówienia.', // TODO: wpisać zasady
    },
]