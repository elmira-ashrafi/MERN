import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import Image from "next/image";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { apiFetch } from "@/lib/api";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

const TABS = [
  { key: "pending", label: "waiting for review" },
  { key: "approved", label: "approved" },
  { key: "rejected", label: "rejected" },
];

export default function AdminRequests() {

  const [adminStatus, setAdminStatus] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [spinner, setSpinner] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});

  /*
   * The queue is loaded by this effect alone. Anything that needs a fresh copy turns the
   * spinner on and bumps `reloadToken`, so the spinner is always switched on by the action
   * rather than inside the effect.
   */
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [listRes, countRes] = await Promise.all([
          apiFetch(`/api/admin/requests?adminStatus=${adminStatus}&page=${page}`),
          apiFetch('/api/admin/requests/counts')
        ]);

        const [listData, countData] = await Promise.all([listRes.json(), countRes.json()]);

        if (cancelled) return;

        // the badge numbers are a nice to have, a failure there is not worth a toast
        if (countRes.ok && countData.ok) setCounts(countData.message);

        if (!listRes.ok || !listData.ok) {
          toast.error(listData.message || GLOBAL_FETCH_FAILURE);
          setRequests([]);
          return;
        }

        setRequests(listData.message);
        setPageInfo({ page: listData.page, pages: listData.pages, total: listData.total });

      } catch {
        if (!cancelled) {
          toast.error(GLOBAL_FETCH_FAILURE);
          setRequests([]);
        }
      } finally {
        if (!cancelled) setSpinner(false);
      }
    })();

    return () => { cancelled = true };
  }, [adminStatus, page, reloadToken]);

  const reload = () => {
    setSpinner(true);
    setReloadToken(token => token + 1);
  }

  const selectTab = key => {
    setSpinner(true);
    setAdminStatus(key);
    setPage(1);
  }

  const goToPage = next => {
    setSpinner(true);
    setPage(next);
  }

  const review = async (request, nextStatus) => {
    const adminNote = notes[request._id] || "";

    if (nextStatus === "rejected" && !adminNote.trim()) {
      toast.error("write a note explaining the rejection");
      return;
    }

    setBusyId(request._id);

    try {
      const res = await apiFetch(`/api/admin/requests/${request._id}/status`, {
        method: "POST",
        body: JSON.stringify({ adminStatus: nextStatus, adminNote })
      });

      const { ok, message } = await res.json();

      if (!res.ok || !ok) {
        toast.error(message);
        return;
      }

      toast.success(message);
      reload();

    } catch {
      toast.error(GLOBAL_FETCH_FAILURE);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminOnly>
      <AdminRoutes>
        <div style={{ width: "95%", margin: "60px auto" }} className="container">
          <h1>moderate requests</h1>
          <p className="text-muted">only approved requests appear in the public archive.</p>

          <div className="d-flex column-gap-2 mt-3">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`btn ${adminStatus === tab.key ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => selectTab(tab.key)}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          {spinner && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

          {!spinner && requests.length === 0 && <p className="mt-4">nothing here.</p>}

          {!spinner && requests.map(request => (
            <div key={request._id} className="border rounded-4 p-3 mt-3">
              <div className="d-flex column-gap-3">
                <Image
                  className="rounded-3"
                  width={140}
                  height={140}
                  src={request.requestImages?.[0]?.url || "/images/avatar.webp"}
                  alt={request.requestImages?.[0]?.alt || request.title}
                  unoptimized={Boolean(request.requestImages?.[0]?.url)}
                />
                <div className="flex-grow-1">
                  <h4 className="mb-1">{request.title}</h4>
                  <p className="text-muted mb-1">
                    by {request.requester?.name} ({request.requester?.email}) · {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-muted mb-1">
                    {request.categorySlugPath} · {request.location?.city?.name}, {request.location?.province?.name}
                    {request.requestImages?.length > 1 && ` · ${request.requestImages.length} images`}
                  </p>
                  <p className="mb-0">{request.description}</p>
                  {request.adminNote && <p className="text-danger mt-2 mb-0"><small>note: {request.adminNote}</small></p>}
                </div>
              </div>

              {adminStatus === "pending" && (
                <div className="d-flex column-gap-2 mt-3">
                  <input
                    className="p-2 flex-grow-1"
                    type="text"
                    value={notes[request._id] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [request._id]: e.target.value }))}
                    placeholder="note to the requester (required to reject)"
                  />
                  <button className="btn btn-success px-4" disabled={busyId === request._id} onClick={() => review(request, "approved")}>
                    {busyId === request._id ? <SyncOutlined spin /> : "approve"}
                  </button>
                  <button className="btn btn-danger px-4" disabled={busyId === request._id} onClick={() => review(request, "rejected")}>
                    reject
                  </button>
                </div>
              )}
            </div>
          ))}

          {!spinner && pageInfo.pages > 1 && (
            <div className="d-flex justify-content-center column-gap-2 mt-3">
              <button className="btn btn-secondary" disabled={pageInfo.page <= 1} onClick={() => goToPage(page - 1)}>previous</button>
              <span className="align-self-center">page {pageInfo.page} of {pageInfo.pages}</span>
              <button className="btn btn-secondary" disabled={pageInfo.page >= pageInfo.pages} onClick={() => goToPage(page + 1)}>next</button>
            </div>
          )}
        </div>
      </AdminRoutes>
    </AdminOnly>
  );
}
