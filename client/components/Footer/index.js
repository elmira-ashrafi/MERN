import { useContext } from "react";
import Link from "next/link";
import { Context } from "@/context/auth";
import styles from "./footer.module.css";

const Footer = () => {

    const { state: { user, authReady } } = useContext(Context);

    const columns = [
        {
            heading: "Browse",
            links: [
                { href: "/", label: "Home" },
                { href: "/requests", label: "All requests" },
                { href: "/categories", label: "Categories" }
            ]
        },
        {
            heading: "Get started",
            links: [
                { href: "/dashboard/submit-request", label: "Post a request" },
                { href: "/dashboard/become-provider", label: "Become a provider" },
                { href: "/dashboard", label: "Your dashboard" }
            ]
        },
        {
            heading: "Account",
            // rendered only once the session is known, so it never flashes the wrong pair of links
            links: authReady && user
                ? [
                    { href: "/dashboard/edit-profile", label: "Edit profile" },
                    { href: "/dashboard/my-requests", label: "Your requests" },
                    { href: "/dashboard/my-proposals", label: "Your proposals" }
                ]
                : [
                    { href: "/login", label: "Log in" },
                    { href: "/register", label: "Register" },
                    { href: "/forgot-password", label: "Reset password" }
                ]
        }
    ];

    return (
        <footer className={styles.footer}>
            <div className="container py-5">
                <div className="row g-4">
                    <div className="col-12 col-lg-4">
                        <div className={styles.brand}>Ask for it.</div>
                        <p className={`${styles.tagline} mt-2 mb-0`}>
                            Post what you need — a product or a service — and let local providers
                            compete with proposals. You pick the best one.
                        </p>
                    </div>

                    {columns.map(column => (
                        <div key={column.heading} className="col-6 col-lg">
                            <div className={styles.heading}>{column.heading}</div>
                            {column.links.map(link => (
                                <Link key={link.href} href={link.href} className={styles.link}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.bottom}>
                <div className="container py-3 d-flex flex-wrap justify-content-between row-gap-1">
                    <span>© {new Date().getFullYear()} Ask for it. All rights reserved.</span>
                    <span>Built with Next.js and Express.</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
