import { SyncOutlined } from "@ant-design/icons"

export default function LocationRow({ location: {_id, name, code, order, isActive}, onEdit, onDelete, onSubmitForm, submitingForm, editingID, editingName, editingCode, editingOrder, editingIsActive, onNameChange, onCodeChange, onOrderChange, onIsActiveChange, SelectComponent, SelectComponentProps }) {
  return (
    <tr key={_id}>
      <td>{editingID === _id ? (<input value={editingName} onChange={onNameChange} />) : (name)}</td>
      <td>{editingID === _id ? (<input value={editingCode} onChange={onCodeChange}/>) : (code)}</td>
      <td>{editingID === _id ? (<input value={editingOrder} onChange={onOrderChange}/>) : (order)}</td>
      <td>{editingID === _id ? 
      (<>
      <input id="editingIsActive" type="checkbox" checked={editingIsActive} onChange={onIsActiveChange} />
      <label htmlFor="editingIsActive">active</label>
      </>) 
      : (<>
      {isActive ? (<span className="text-success">active</span>) : (<span className="text-danger">inactive</span>)}
      </>)
      }</td>
      {editingID === _id && (<td>
        <SelectComponent {...SelectComponentProps} />
      </td>)}
      <td>{editingID === _id 
        ? <button disabled={submitingForm && submitingForm === 'edit'} onClick={onSubmitForm} className="btn btn-primary mx-auto">{submitingForm && submitingForm === 'edit' ? <SyncOutlined spin /> : <>Submit</>}</button> 
        : (<>
          <button onClick={onEdit} className="btn btn-warning">Edit</button>
          <button onClick={onDelete} className="btn btn-danger ms-2">Delete</button>
        </>)}
      </td>                                    
    </tr>
  )
}