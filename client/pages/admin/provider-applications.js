import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { apiFetch } from "@/lib/api";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

const TABS = [
  { key: "pending", label: "waiting for review" },
  { key: "approved", label: "approved" },
  { key: "rejected", label: "rejected" },
];

//documents are not on the public /uploads mount, they come through an authenticated route
const docHref = (application, url) =>
  `/api/provider-application/doc/${url.split("/").pop()}?applicationId=${application._id}`;

export default function AdminProviderApplications() {

  const [status, setStatus] = useState("pending");
  const [applications, setApplications] = useState([]);
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
        const res = await apiFetch(`/api/admin/provider-applications?status=${status}&page=${page}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.ok) {
          toast.error(data.message || GLOBAL_FETCH_FAILURE);
          setApplications([]);
          return;
        }

        setApplications(data.message);
        setPageInfo({ page: data.page, pages: data.pages, total: data.total });

      } catch {
        if (!cancelled) {
          toast.error(GLOBAL_FETCH_FAILURE);
          setApplications([]);
        }
      } finally {
        if (!cancelled) setSpinner(false);
      }
    })();

    return () => { cancelled = true };
  }, [status, page, reloadToken]);

  const reload = () => {
    setSpinner(true);
    setReloadToken(token => token + 1);
  }

  const selectTab = key => {
    setSpinner(true);
    setStatus(key);
    setPage(1);
  }

  const goToPage = next => {
    setSpinner(true);
    setPage(next);
  }

  const review = async (application, nextStatus) => {
    const adminNote = notes[application._id] || "";

    if (nextStatus === "rejected" && !adminNote.trim()) {
      toast.error("write a note explaining the rejection");
      return;
    }

    setBusyId(application._id);

    try {
      const res = await apiFetch(`/api/admin/provider-applications/${application._id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus, adminNote })
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
          <h1>provider applications</h1>
          <p className="text-muted">approving grants the Provider role and copies the claimed fields onto the account.</p>

          <div className="d-flex column-gap-2 mt-3">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`btn ${status === tab.key ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => selectTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {spinner && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

          {!spinner && applications.length === 0 && <p className="mt-4">nothing here.</p>}

          {!spinner && applications.map(application => (
            <div key={application._id} className="border rounded-4 p-3 mt-3">
              <h4 className="mb-1">{application.user?.name}</h4>
              <p className="text-muted mb-1">
                {application.user?.email}
                {application.user?.phoneNumber ? ` · ${application.user.phoneNumber}` : ""}
                {" · "}applied {new Date(application.createdAt).toLocaleDateString()}
              </p>
              <p className="mb-1">
                fields: {application.businessCategories?.map(category => category.name).join(", ") || "—"}
              </p>
              <p className="mb-2">
                business location: {application.businessLocation?.city?.name}, {application.businessLocation?.province?.name}, {application.businessLocation?.country?.name}
              </p>

              <div className="d-flex column-gap-2 flex-wrap">
                {application.uploadedDocs?.map(doc => (
                  <a
                    key={doc.url}
                    className="btn btn-sm btn-outline-secondary"
                    href={docHref(application, doc.url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.originalName} ({Math.round(doc.size / 1024)} KB)
                  </a>
                ))}
              </div>

              {application.adminNote && <p className="text-danger mt-2 mb-0"><small>note: {application.adminNote}</small></p>}
              {application.reviewedBy && (
                <p className="text-muted mt-1 mb-0">
                  <small>reviewed by {application.reviewedBy.name} on {new Date(application.reviewedAt).toLocaleDateString()}</small>
                </p>
              )}

              {status === "pending" && (
                <div className="d-flex column-gap-2 mt-3">
                  <input
                    className="p-2 flex-grow-1"
                    type="text"
                    value={notes[application._id] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [application._id]: e.target.value }))}
                    placeholder="note to the applicant (required to reject)"
                  />
                  <button className="btn btn-success px-4" disabled={busyId === application._id} onClick={() => review(application, "approved")}>
                    {busyId === application._id ? <SyncOutlined spin /> : "approve"}
                  </button>
                  <button className="btn btn-danger px-4" disabled={busyId === application._id} onClick={() => review(application, "rejected")}>
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
