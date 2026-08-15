import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { apiFetch } from "@/lib/api";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

export default function AdminUsers() {

  const [users, setUsers] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [spinner, setSpinner] = useState(true);
  const [busyId, setBusyId] = useState(null);

  /*
   * The list is loaded by this effect alone. Anything that needs a fresh copy — a filter, a
   * page, or a role change that just landed — turns the spinner on and bumps `reloadToken`,
   * so the spinner is always switched on by the action rather than inside the effect.
   */
  const [reloadToken, setReloadToken] = useState(0);
  const [appliedSearch, setAppliedSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams({ page });
        if (appliedSearch) params.set("search", appliedSearch);
        if (role) params.set("role", role);

        const res = await apiFetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.ok) {
          toast.error(data.message || GLOBAL_FETCH_FAILURE);
          setUsers([]);
          return;
        }

        setUsers(data.message);
        setPageInfo({ page: data.page, pages: data.pages, total: data.total });

      } catch {
        if (!cancelled) {
          toast.error(GLOBAL_FETCH_FAILURE);
          setUsers([]);
        }
      } finally {
        if (!cancelled) setSpinner(false);
      }
    })();

    return () => { cancelled = true };
  }, [page, appliedSearch, role, reloadToken]);

  const reload = () => {
    setSpinner(true);
    setReloadToken(token => token + 1);
  }

  const applySearch = e => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
    reload()
  }

  const selectRole = value => {
    setSpinner(true);
    setRole(value);
    setPage(1);
  }

  const goToPage = next => {
    setSpinner(true);
    setPage(next);
  }

  const toggleProvider = async (user) => {
    setBusyId(user._id);

    try {
      const res = await apiFetch(`/api/admin/users/${user._id}/provider-role`, {
        method: "POST",
        body: JSON.stringify({ isProvider: !user.role.includes("Provider") })
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

  const locationOf = user => {
    const location = user.requesterProfile?.location;
    if (!location?.city) return "—";
    return `${location.city.name}, ${location.province?.name}`;
  }

  return (
    <AdminOnly>
      <AdminRoutes>
        <div style={{ width: "95%", margin: "60px auto" }} className="container">
          <h1>manage users</h1>
          {!spinner && <p className="text-muted">{pageInfo.total} user(s)</p>}

          <form className="d-flex column-gap-2 mt-3" onSubmit={applySearch}>
            <input
              className="p-2 flex-grow-1"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="search by name, email or phone"
            />
            <select className="p-2" value={role} onChange={e => selectRole(e.target.value)}>
              <option value="">every role</option>
              <option value="Requester">Requester</option>
              <option value="Provider">Provider</option>
              <option value="Admin">Admin</option>
            </select>
            <button className="btn btn-primary px-4" type="submit">search</button>
          </form>

          {spinner && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

          {!spinner && users.length === 0 && <p className="mt-4">no user matched.</p>}

          {!spinner && users.length > 0 && (
            <table className="table table-striped mt-3 align-middle">
              <thead>
                <tr><th>name</th><th>email</th><th>phone</th><th>roles</th><th>location</th><th>joined</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber || "—"}</td>
                    <td>{user.role.join(", ")}</td>
                    <td>{locationOf(user)}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.role.includes("Provider") ? "btn-outline-danger" : "btn-outline-success"}`}
                        disabled={busyId === user._id}
                        onClick={() => toggleProvider(user)}
                      >
                        {busyId === user._id
                          ? <SyncOutlined spin />
                          : user.role.includes("Provider") ? "revoke provider" : "make provider"}
                      </button>
                    </td>
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

          <p className="text-muted mt-4">
            <small>the Admin role is granted from the server with <code>npm run make-admin -- &lt;email&gt;</code>, never from this page.</small>
          </p>
        </div>
      </AdminRoutes>
    </AdminOnly>
  );
}
