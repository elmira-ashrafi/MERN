import { useEffect, useState } from "react";
import { SyncOutlined } from "@ant-design/icons"
import { locationsPluralMap } from "@/lib/config";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/strings";
import { apiFetch } from "@/lib/api";

export default function LocationTable({ children, locationList, loadLocationsList, locationType, listSpinner, extraFields, setEditingParentLocation = null, parentLocation = null }) {

  const [editingID, setEditingID] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingCode, setEditingCode] = useState("");
  const [editingOrder, setEditingOrder] = useState("");
  const [editingIsActive, setEditingIsActive] = useState(null);

  const [deleteSpinner, setDeleteSpinner] = useState(null);
  const [editSpinner, setEditSpinner] = useState(false);

  const setEditingForm = (editingLocation) => {
    setEditingID(editingLocation?._id || '')
    setEditingName(editingLocation?.name || '')
    setEditingCode(editingLocation?.code || '')
    setEditingOrder(editingLocation?.order || 0)
    setEditingIsActive(editingLocation?.isActive || null)
  }

  const editRow = (locationId) => {
    const editingLocation = locationList.find((location) => location._id === locationId);
    setEditingForm(editingLocation)
    if(setEditingParentLocation && parentLocation) setEditingParentLocation(parentLocation);
  };

  const deleteLocation = async (locationId) => {
    try {
      setDeleteSpinner(locationId)
      const res = await apiFetch(`/api/admin/${locationsPluralMap[locationType]['plural']}/${locationId}`, {method: "DELETE"});
      const {ok, message} = await res.json()

      if(!res.ok || !ok) {
        toast.error(message)
        return;
      }

      toast.success(`${locationType} deleted successfully`)
      loadLocationsList()
    }
    catch(err) {
      toast.error(getErrorMessage(err));
    }
    finally {
      setDeleteSpinner(null);
    }
  }

  const editLocation = async (e, id) => {
    e.preventDefault();
    setEditSpinner(true);

    const path = `/api/admin/${locationsPluralMap[locationType]['plural']}/${id}`;
    const fetchConfig = {
      method: "PATCH",
      body: JSON.stringify({ ...extraFields, _id: editingID, name: editingName, code: editingCode, order: editingOrder, isActive: editingIsActive })
    };

    try {
      const res = await apiFetch(path, fetchConfig);

      const {ok, message} = await res.json();

      if(!res.ok || !ok) {
        toast.error(message);
        return;
      }

      toast.success(`${locationType} has been edited`);
      setEditingForm()
      loadLocationsList();
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEditSpinner(false);
    }
  }

  const submitOnEnterInsideEditField = (e, id) => {
    if(e.key !== 'Enter') return;
    if(!e.target.matches('input[data-editing-field]')) return;
    editLocation(e, id);
  }

  useEffect(() => {
    const clearEditingRowOnEscapeKeyDown = (e) => {
      if(e.key === 'Escape' && editingID) setEditingForm();
    }

    window.addEventListener('keydown', clearEditingRowOnEscapeKeyDown);
    return () => window.removeEventListener('keydown', clearEditingRowOnEscapeKeyDown);
  }, [editingID])

  useEffect(() => { setEditingForm() }, [parentLocation])
  
  return (<>
    {listSpinner && <SyncOutlined spin className="fs-3" />}
    {locationsPluralMap[locationType]['parent'] && !parentLocation && <p className="text-muted">select a {locationsPluralMap[locationType]['parent']} to see its {locationsPluralMap[locationType]['plural']}.</p>}
    {locationsPluralMap[locationType]['parent'] && parentLocation && !listSpinner && locationList.length === 0 && <p className="text-muted">this {locationsPluralMap[locationType]['parent']} has no {locationsPluralMap[locationType]['plural']}.</p>}
    {!listSpinner && locationList.length > 0 && (
      <table className="table table-striped mt-2">
        <thead>
          <tr>
            <th>name</th>
            <th>code</th>
            <th>order</th>
            <th>status</th>
            {children && editingID && <td>{locationsPluralMap[locationType]['parent']}</td>}
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          {locationList.map(({_id, name, code, order, isActive}) => (  
          <tr key={_id} onKeyDown={editingID === _id ? e => submitOnEnterInsideEditField(e, _id) : undefined}>
            <td>{editingID === _id ? (<input data-editing-field value={editingName} onChange={e=> setEditingName(e.target.value)} />) : (name)}</td>
            <td>{editingID === _id ? (<input data-editing-field value={editingCode} onChange={e=> setEditingCode(e.target.value)}/>) : (code)}</td>
            <td>{editingID === _id ? (<input data-editing-field value={editingOrder} onChange={e=> setEditingOrder(e.target.value)}/>) : (order)}</td>
            <td>{editingID === _id ? 
            (<>
            <input id="editingIsActive" type="checkbox" checked={editingIsActive} onChange={e=> setEditingIsActive(e.target.checked)} />
            <label htmlFor="editingIsActive">active</label>
            </>) 
            : (<>
            {isActive ? (<span className="text-success">active</span>) : (<span className="text-danger">inactive</span>)}
            </>)
            }</td>
            {editingID === _id && children && (<td>{children}</td>)}
            <td>{editingID === _id 
              ? <button disabled={editSpinner} onClick={e => editLocation(e, _id)} className="btn btn-primary mx-auto">{editSpinner ? <SyncOutlined spin /> : <>Submit</>}</button> 
              : (<>
                <button onClick={() => editRow(_id)} className="btn btn-warning">Edit</button>
                <button disabled={deleteSpinner === _id} onClick={() => deleteLocation(_id)} className="btn btn-danger ms-2">{deleteSpinner && deleteSpinner === _id ? <SyncOutlined spin /> : 'Delete'}</button>
              </>)}
            </td>                                    
          </tr>
          ))}
        </tbody>
      </table>
    )}
  </>)
}