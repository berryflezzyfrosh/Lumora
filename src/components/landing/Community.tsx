import { Bookmark, Heart, MessageCircle } from 'lucide-react';
import { IMAGES } from '@/lib/images';

const posts = [
  {
    title: 'Night drive in neon',
    category: 'Cinematic Edits',
    image: IMAGES.community.nightDriveNeon,
    span: 'sm:row-span-2',
  },
  {
    title: 'Liquid colour study',
    category: 'Visual Effects',
    image: IMAGES.community.liquidColourStudy,
    span: '',
  },
  {
    title: 'Retouched portrait series',
    category: 'Photography',
    image: IMAGES.community.retouchedPortrait,
    span: '',
  },
  {
    title: 'Studio grading session',
    category: 'Video Editing',
    image: IMAGES.community.studioGrading,
    span: '',
  },
];

export default function Community() {
  return (
    <section id="community" className="border-y border-surface-border bg-surface-subtle py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">Community showcase</p>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-5xl">Made on LUMORA, shared with the world</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">
            Edits, photographs and templates from creators in every category. Like, comment, save and follow the
            people who inspire you.
          </p>
        </div>

        <div className="mt-14 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <figure
              key={post.title}
              className={`group relative overflow-hidden rounded-3xl border border-surface-border bg-surface-panel ${post.span}`}
            >
              <img
                src={post.image}
                alt={post.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80 transition duration-500 group-hover:opacity-100" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {post.category}
                  </span>
                  <p className="mt-2 text-base font-semibold text-white">{post.title}</p>
                </div>
                <div className="flex translate-y-2 gap-2 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                    <Heart className="h-4 w-4" />
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                    <Bookmark className="h-4 w-4" />
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
