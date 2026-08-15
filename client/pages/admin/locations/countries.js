import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { apiFetch } from "@/lib/api";
import { handleFetch } from "@/lib/api";

const GLOBAL_FETCH_FAILURE =
  "something went wrong! check your network connectivity";

export default function AdminCountries() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [countries, setCountries] = useState([]);
  const [listSpinner, setListSpinner] = useState(false);
  const [submitingForm, setSubmitingForm] = useState(null);

  const [editingID, setEditingID] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [editingOrder, setEditingOrder] = useState("");
  const [editingIsActive, setEditingIsActive] = useState(null);

  const loadCountries = () => {
    handleFetch(
      setListSpinner,
      "/api/admin/countries",
      {},
      GLOBAL_FETCH_FAILURE,
      setCountries,
    );
  };

  useEffect(loadCountries, []);

  const handleSubmit = async (e, mode = "add") => {
    e.preventDefault();
    setSubmitingForm(mode);

    let fetchConfig = {};
    let path = "";

    if(mode === "add") {
      path = "/api/admin/countries"
      fetchConfig.method= "POST"
      fetchConfig.body= JSON.stringify({ name, code, order, isActive })
    }

    else {
      path = `/api/admin/countries/${editingID}`
      fetchConfig.method= "PATCH"
      fetchConfig.body= JSON.stringify({ _id: editingID, name: editingName, code: editingCode, order: editingOrder, isActive: editingIsActive })
    }

    try {
      const res = await apiFetch(path, fetchConfig);

      const { ok, message } = await res.json();

      if (!res.ok || !ok) {
        toast.error(message);
        return;
      }

      toast.success(`${message.name} has been ${mode}ed`);
      if(mode === 'add') {
        setName("");
        setCode("");
        setOrder(0);
        setIsActive(true);
      } else {
        setEditingID(null)
        setEditingCode('')
        setEditingName('')
        setEditingOrder('')
        setEditingIsActive(null)
      }
      loadCountries();
    } catch {
      toast.error(GLOBAL_FETCH_FAILURE);
    } finally {
      setSubmitingForm(null);
    }
  };

  const editBtn = (countryId) => {
    const editingCountry = countries.find((country) => country._id === countryId);
    setEditingID(editingCountry._id)
    setEditingCode(editingCountry.code)
    setEditingName(editingCountry.name)
    setEditingOrder(editingCountry.order)
    setEditingIsActive(editingCountry.isActive)
  };

  const deleteBtn = (countryId) => {};

  return (
    <AdminOnly>
      <AdminRoutes>
        <div
          style={{ width: "90%", margin: "60px auto" }}
          className="container"
        >
          <h1>countries</h1>

          <form
            className="d-flex flex-column gap-2 border rounded-4 p-3 mt-3"
            onSubmit={handleSubmit}
          >
            <h5 className="mb-2">add a new country</h5>

            <div className="d-flex column-gap-4">
              <div className="d-flex w-50 flex-column row-gap-1">
                <label htmlFor="name">name</label>
                <input
                  className="p-2"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name="name"
                  id="name"
                  placeholder="United Stated"
                />
              </div>
              <div className="d-flex w-50 flex-column row-gap-1">
                <label htmlFor="code">code</label>
                <input
                  className="p-2"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  name="code"
                  id="code"
                  placeholder="US"
                />
              </div>
            </div>

            <div className="d-flex column-gap-4 mt-2 align-items-end">
              <div className="d-flex w-50 flex-column row-gap-1">
                <label htmlFor="order">
                  order{" "}
                  <small className="text-muted">(lower comes first)</small>
                </label>
                <input
                  className="p-2"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  name="order"
                  id="order"
                />
              </div>
              <label
                className="w-50 d-flex align-items-center column-gap-2 pb-2"
                htmlFor="isActive"
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  name="isActive"
                  id="isActive"
                />
                <span>
                  active{" "}
                  <small className="text-muted">
                    (inactive ones are hidden from users)
                  </small>
                </span>
              </label>
            </div>

            <div className="w-25 mt-3">
              <button
                disabled={submitingForm && submitingForm === 'add' || !name.trim() || !code.trim()}
                type="submit"
                className="btn btn-primary p-2 w-100"
              >
                {submitingForm && submitingForm === 'add' ? <SyncOutlined spin /> : "add country"}
              </button>
            </div>
          </form>

          <h5 className="mt-4">existing countries</h5>
          {listSpinner && <SyncOutlined spin className="fs-3" />}
          {!listSpinner && countries.length === 0 && (
            <p className="text-muted">no country has been added yet.</p>
          )}
          {!listSpinner && countries.length > 0 && (
            <table className="table table-striped mt-2">
              <thead>
                <tr>
                  <th>name</th>
                  <th>code</th>
                  <th>order</th>
                  <th>status</th>
                  <th>actions</th>
                </tr>
              </thead>
              <tbody>
                {countries.map(({_id, name, code, order, isActive}) => (
                  <tr key={_id}>
                    <td>{editingID === _id ? (<input value={editingName} onChange={(e) => setEditingName(e.target.value)} />) : (name)}</td>
                    <td>{editingID === _id ? (<input value={editingCode} onChange={(e) => setEditingCode(e.target.value)}/>) : (code)}</td>
                    <td>{editingID === _id ? (<input value={editingOrder} onChange={(e) => setEditingOrder(e.target.value)}/>) : (order)}</td>
                    <td>{editingID === _id ? 
                    (<>
                    <input id="editingIsActive" type="checkbox" checked={editingIsActive} onChange={(e)=> setEditingIsActive(e.target.checked)} />
                    <label htmlFor="editingIsActive">active</label>
                    </>) 
                    : (<>
                    {isActive ? (<span className="text-success">active</span>) : (<span className="text-danger">inactive</span>)}
                    </>)
                    }</td>
                    <td>{editingID === _id ? <button disabled={submitingForm && submitingForm === 'edit'} onClick={(e) => handleSubmit(e, "edit")} className="btn btn-primary mx-auto">{submitingForm && submitingForm === 'edit' ? (<SyncOutlined spin />) : (<>Submit</>)}</button> : (<>
                      <button onClick={() => editBtn(_id)} className="btn btn-warning">Edit</button>
                      <button onClick={() => deleteBtn(_id)} className="btn btn-danger ms-2">Delete</button>
                    </>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminRoutes>
    </AdminOnly>
  );
}
