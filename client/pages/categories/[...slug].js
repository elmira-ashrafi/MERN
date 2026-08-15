import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import Link from "next/link"
import { toast } from "react-toastify"
import { SyncOutlined } from "@ant-design/icons"
import { apiFetch } from "@/lib/api"
import { handleFetch } from "@/lib/api"
import { trimChars } from "@/lib/strings"

const globalFetchFailureMsg = "something went wrong! check your network connectivity";

const CategoryPage = () => {

    const router = useRouter();
    const { slug, page } = router.query;

    const slugPath = Array.isArray(slug) ? slug.join('/') : '';

    const [categories, setCategories] = useState([]);
    const [catsSpinner, setCatsSpinner] = useState(true);

    const [requests, setRequests] = useState([]);
    const [pageInfo, setPageInfo] = useState({page: 1, pages: 1, total: 0});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        handleFetch(setCatsSpinner, '/api/get-cats', {}, globalFetchFailureMsg, setCategories)
    }, [])

    const category = categories.find(cat => cat.slugPath === slugPath) || null;
    const subCategories = category ? categories.filter(cat => cat.parent === category._id) : [];

    // ancestors come back oldest-first already, so ordering the breadcrumb only needs a lookup
    const breadcrumb = category
        ? category.ancestors
            .map(id => categories.find(cat => cat._id === id))
            .filter(Boolean)
        : [];

    useEffect(() => {
        if(!router.isReady || catsSpinner) return;

        if(!category) {
            setLoading(false);
            return;
        }

        (async () => {
            setLoading(true);

            try {
                // only approved, still-open requests come back from this endpoint
                const params = new URLSearchParams();
                params.set('category', category._id);
                if(page) params.set('page', page);

                const res = await apiFetch(`/api/get-requests?${params.toString()}`);
                const data = await res.json();

                if(!res.ok || !data.ok) {
                    toast.error(data.message || 'failed to load requests');
                    setRequests([]);
                    return;
                }

                setRequests(Array.isArray(data.message) ? data.message : []);
                setPageInfo({page: data.page, pages: data.pages, total: data.total});

            } catch {
                toast.error(globalFetchFailureMsg);
                setRequests([]);
            } finally {
                setLoading(false);
            }
        })()
    }, [router.isReady, catsSpinner, category, page])

    const goToPage = target => {
        router.push({pathname: `/categories/${slugPath}`, query: {page: target}});
    }

    if(catsSpinner) {
        return <div className="container my-5 text-center py-5"><SyncOutlined spin className="fs-1" /></div>
    }

    if(!category) {
        return (
            <div className="container my-5">
                <h3 className="mt-5 text-center">category not found</h3>
            </div>
        )
    }

    return (
        <div className="container my-5">
            <nav className="mb-2">
                <Link href="/categories">categories</Link>
                {breadcrumb.map(cat => (
                    <span key={cat._id}> / <Link href={`/categories/${cat.slugPath}`}>{cat.name}</Link></span>
                ))}
                <span> / {category.name}</span>
            </nav>

            <h1>{category.name}</h1>

            {subCategories.length > 0 && (
                <div className="d-flex flex-wrap column-gap-2 mb-4">
                    {subCategories.map(cat => (
                        <Link key={cat._id} href={`/categories/${cat.slugPath}`} className="btn btn-outline-secondary btn-sm">{cat.name}</Link>
                    ))}
                </div>
            )}

            {!loading && <p className="text-muted">{pageInfo.total} open request(s)</p>}

            {loading && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

            {!loading && requests.length === 0 && <h3 className="mt-5 text-center">no request found</h3>}

            {requests.map(req => (
                <div key={req._id} className="d-flex border rounded-4 p-2 mb-2">
                    <div className="w-20 p-1 d-flex justify-content-center align-items-center">
                        {/* uploaded files are proxied from the api, so they skip the next image optimizer */}
                        <Image
                            className="m-auto"
                            width={160}
                            height={160}
                            src={req.requestImages?.[0]?.url || "/images/avatar.webp"}
                            alt={req.requestImages?.[0]?.alt || req.title}
                            unoptimized={Boolean(req.requestImages?.[0]?.url)}
                        />
                    </div>
                    <div className="w-80 p-2">
                        <h3 className="mb-1">{trimChars(req.title, 60)}</h3>
                        <p className="mb-1 text-muted">{req.categorySlugPath}</p>
                        <p className="mb-1">{trimChars(req.description, 200)}</p>
                        <div className="d-flex column-gap-3">
                            <span>city: {req.location?.city?.name || '-'}</span>
                            <span>proposals: {req.proposalCount}</span>
                        </div>
                    </div>
                </div>
            ))}

            {!loading && pageInfo.pages > 1 && (
                <div className="d-flex justify-content-center column-gap-2 mt-4">
                    <button className="btn btn-secondary" disabled={pageInfo.page <= 1} onClick={() => goToPage(pageInfo.page - 1)}>previous</button>
                    <span className="align-self-center">page {pageInfo.page} of {pageInfo.pages}</span>
                    <button className="btn btn-secondary" disabled={pageInfo.page >= pageInfo.pages} onClick={() => goToPage(pageInfo.page + 1)}>next</button>
                </div>
            )}
        </div>
    )
}

export default CategoryPage
