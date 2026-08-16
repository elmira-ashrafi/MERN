import { useContext } from "react";
import Link from "next/link";
import { Context } from "@/context/auth";
import HeroVideo from "@/components/HeroVideo";

const Index = () => {
    const { state: { user, authReady } } = useContext(Context);

    return (
        <div className="container py-4">
            <div className="row align-items-center g-5">
                <div className="col-12 col-lg-6 text-center text-lg-start">
                    <h1 className="fw-bold" style={{ fontSize: "2.5rem" }}>
                        Ask for it. <span style={{ color: "var(--bs-primary)" }}>Get it done.</span>
                    </h1>
                    <p className="text-secondary fs-5 mt-3">
                        Post what you need — a product or a service — and let local providers
                        compete with proposals. You pick the best one.
                    </p>

                    <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap mt-4">
                        {authReady && user ? (
                            <Link href="/dashboard/submit-request" className="btn btn-primary btn-lg">
                                Post a new request
                            </Link>
                        ) : (
                            <Link href="/register" className="btn btn-primary btn-lg">
                                Get started, it's free
                            </Link>
                        )}
                        <Link href="/requests" className="btn btn-outline-primary btn-lg">
                            Browse requests
                        </Link>
                    </div>

                    {authReady && !user && (
                        <p className="text-secondary mt-3 fs-small">
                            Already have an account? <Link href="/login">Log in</Link> · Want to offer your
                            services? <Link href="/dashboard/become-provider">Become a provider</Link>
                        </p>
                    )}
                </div>

                <div className="col-12 col-lg-6">
                    <HeroVideo />
                </div>
            </div>
        </div>
    );
};

export default Index;
