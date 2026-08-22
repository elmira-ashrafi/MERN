import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { SyncOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { trimChars } from "@/lib/strings";
import styles from "./requestsScroller.module.css";

const RequestsScroller = ({ requests = [], spinner = false }) => {

    const root = useRef(null);
    const track = useRef(null);
    const progress = useRef(null);

    useGSAP(() => {
        if (requests.length < 2) return;

        gsap.registerPlugin(ScrollTrigger, SplitText);

        // the chars slide in from the right and are clipped by the heading's own overflow
        const split = new SplitText(`.${styles.title}`, { type: "chars" });

        // the whole section enters once, when the scroll reaches it: title first, then the cards
        const entry = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: { trigger: root.current, start: "top 50%" },
        });

        entry.from(split.chars, {
            xPercent: 120,
            opacity: 0,
            duration: 1,
            stagger: 0.08,
        });

        // the cards land the same way the chars did: each slides in from its own right, one after another
        entry.from(`.${styles.card}`, {
            xPercent: 120,
            opacity: 0,
            duration: 0.8,
            stagger: 0.12,
        });

        const mm = gsap.matchMedia();

        // the pin is desktop only: on touch sizes the strip stays a normal swipeable overflow list
        mm.add("(min-width: 992px) and (prefers-reduced-motion: no-preference)", () => {

            // measured lazily so a resize recomputes it instead of reusing the first layout
            const distance = () => Math.max(0, track.current.scrollWidth - root.current.offsetWidth);

            const horizontal = gsap.to(track.current, {
                x: () => -distance(),
                ease: "none",
                scrollTrigger: {
                    trigger: root.current,
                    pin: true,
                    scrub: 1,
                    start: "top top",
                    end: () => "+=" + distance(),
                    invalidateOnRefresh: true,
                    anticipatePin: 1,
                    // this pin adds a spacer that shifts everything below it, so it must be
                    // measured before the sections whose start positions depend on that height
                    refreshPriority: 1,
                    onUpdate: self => gsap.set(progress.current, { scaleX: self.progress }),
                },
            });

            return () => horizontal.scrollTrigger?.kill();
        });

        return () => {
            mm.revert();
            split.revert();
        };
    }, { scope: root, dependencies: [requests] });

    return (
        <section ref={root} className={styles.section}>
            <div className={styles.head}>
                <h2 className={styles.title}>Recent requests</h2>
                <div className={styles.progressTrack}>
                    <div ref={progress} className={styles.progressBar} />
                </div>
            </div>

            {spinner && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

            {!spinner && requests.length === 0 && <p className={styles.head}>No open requests yet.</p>}

            {!spinner && requests.length > 0 && (
                <div className={styles.viewport}>
                    <div ref={track} className={styles.track}>
                        {requests.map(req => (
                            <article key={req._id} className={styles.card}>
                                <Image
                                    className={styles.thumb}
                                    width={380}
                                    height={220}
                                    src={req.requestImages?.[0]?.url || "/images/avatar.webp"}
                                    alt={req.requestImages?.[0]?.alt || req.title}
                                    unoptimized={Boolean(req.requestImages?.[0]?.url)}
                                />
                                <div className={styles.body}>
                                    <h3 className={styles.cardTitle}>
                                        <Link href={`/requests/${req._id}`}>{trimChars(req.title, 50)}</Link>
                                    </h3>
                                    <p className="text-secondary mb-0 fs-small">{trimChars(req.description, 110)}</p>
                                    <div className={styles.meta}>
                                        <span>{req.location?.city?.name || "-"}</span>
                                        <span>{req.proposalCount} proposal(s)</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export default RequestsScroller;
