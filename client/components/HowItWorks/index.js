import { Fragment, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./howItWorks.module.css";

const STEPS = [
    "submit request",
    "receive proposals",
    "accept one and start"
];

const HowItWorks = () => {

    const root = useRef(null);
    const progress = useRef(null);

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger, SplitText);

        // the chars slide in from the right and are clipped by the heading's own overflow
        const split = new SplitText(`.${styles.title}`, { type: "chars" });

        const entry = gsap.timeline({
            defaults: { ease: "power3.out" },
            // fires only once the section is properly in view, not while the pinned slider is still up
            scrollTrigger: { trigger: root.current, start: "top 70%" },
        });

        entry.from(split.chars, {
            xPercent: 120,
            opacity: 0,
            duration: 1,
            stagger: 0.08,
        });

        // the rule draws itself once the heading has landed, then hands over to the steps
        entry.to(progress.current, {
            scaleX: 1,
            duration: 0.5,
            ease: "power2.inOut",
        });

        entry.from(`.${styles.step}`, {
            opacity: 0,
            y: 24,
            duration: 0.3,
            stagger: 0.15,
        });

        return () => split.revert();
    }, { scope: root });

    return (
        <div ref={root} className="container py-5">
            <h2 className={`${styles.title}`}>How it works</h2>
            <div className={styles.progressTrack}>
                <div ref={progress} className={styles.progressBar} />
            </div>
            <div className={styles.box}>
                <div className={styles.steps}>
                    {STEPS.map((step, i) => (
                        <Fragment key={step}>
                            {i > 0 && <div className={styles.connector} />}
                            <div className={styles.step}>
                                <div className={styles.number}>{i + 1}</div>
                                <p className={styles.label}>{step}</p>
                            </div>
                        </Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
