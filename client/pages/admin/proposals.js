import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { apiFetch } from "@/lib/api";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

const STATUSES = ["", "pending", "accepted", "rejected", "withdrawn"];

export default function AdminProposals() {

  const [status, setStatus] = useState("");
  const [proposals, setProposals] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [spinner, setSpinner] = useState(true);

  // the spinner is switched on by the action that starts a load, never inside the effect
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams({ page });
        if (status) params.set("status", status);

        const res = await apiFetch(`/api/admin/proposals?${params.toString()}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.ok) {
          toast.error(data.message || GLOBAL_FETCH_FAILURE);
          setProposals([]);
          return;
        }

        setProposals(data.message);
        setPageInfo({ page: data.page, pages: data.pages, total: data.total });

      } catch {
        if (!cancelled) {
          toast.error(GLOBAL_FETCH_FAILURE);
          setProposals([]);
        }
      } finally {
        if (!cancelled) setSpinner(false);
      }
    })();

    return () => { cancelled = true };
  }, [status, page]);

  const selectStatus = value => {
    setSpinner(true);
    setStatus(value);
    setPage(1);
  }

  const goToPage = next => {
    setSpinner(true);
    setPage(next);
  }

  return (
    <AdminOnly>
      <AdminRoutes>
        <div style={{ width: "95%", margin: "60px auto" }} className="container">
          <h1>proposals</h1>
          {!spinner && <p className="text-muted">{pageInfo.total} proposal(s)</p>}

          <select
            className="p-2 mt-2"
            value={status}
            onChange={e => selectStatus(e.target.value)}
          >
            {STATUSES.map(value => (
              <option key={value || "all"} value={value}>{value || "every status"}</option>
            ))}
          </select>

          {spinner && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

          {!spinner && proposals.length === 0 && (
            <p className="mt-4">
              no proposal yet — providers cannot submit one from the app, that part is not built.
            </p>
          )}

          {!spinner && proposals.length > 0 && (
            <table className="table table-striped mt-3 align-middle">
              <thead>
                <tr><th>request</th><th>provider</th><th>price</th><th>status</th><th>submitted</th></tr>
              </thead>
              <tbody>
                {proposals.map(proposal => (
                  <tr key={proposal._id}>
                    <td>{proposal.request?.title || "—"}</td>
                    <td>{proposal.provider?.name} <small className="text-muted">{proposal.provider?.email}</small></td>
                    <td>{proposal.price}</td>
                    <td>{proposal.status}</td>
                    <td>{new Date(proposal.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
