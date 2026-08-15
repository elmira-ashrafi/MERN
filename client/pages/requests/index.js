import { useContext, useEffect, useState } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import Link from "next/link"
import { toast } from "react-toastify"
import { SyncOutlined } from "@ant-design/icons"
import { apiFetch } from "@/lib/api"
import { trimChars } from "@/lib/strings"
import { Context } from "@/context"

const Requests = () => {

  const router = useRouter();

  const {state: {user}} = useContext(Context)

  const [requests, setRequests] = useState([]);
  const [pageInfo, setPageInfo] = useState({page: 1, pages: 1, total: 0});
  const [loading, setLoading] = useState(true);

  const { category, city, categoryType, page } = router.query;

  useEffect(() => {
    if(!router.isReady) return

    (async () => {
      setLoading(true);

      try {
        // only approved, still-open requests come back from this endpoint
        const params = new URLSearchParams();
        if(category) params.set('category', category);
        if(city) params.set('city', city);
        if(categoryType) params.set('categoryType', categoryType);
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
        toast.error("something went wrong! check your network connectivity");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    })()
  }, [router.isReady, category, city, categoryType, page])

  const goToPage = target => {
    router.push({pathname: '/requests', query: {...router.query, page: target}});
  }

  return (
    <div className="container my-5">
      <h1>requests archive</h1>
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
            <h3 className="mb-1">
              <Link href={`/requests/${req._id}`}>{trimChars(req.title, 60)}</Link>
            </h3>
            <p className="mb-1 text-muted">
              <Link href={`/categories/${req.categorySlugPath}`}>{req.categorySlugPath}</Link>
            </p>
            <div className="d-flex column-gap-2 align-items-center justify-content-between my-3">
              <p>{trimChars(req.description, 200)}</p>
              {user && user?._id !== String(req.requester) && user.role.includes('Provider') && <Link href={`/dashboard/submit-proposal/${req._id}`} className="btn btn-success text-white text-nowrap">Submit proposal</Link>}
            </div>
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

export default Requests
