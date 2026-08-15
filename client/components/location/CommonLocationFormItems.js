import { SyncOutlined } from "@ant-design/icons"

export default function CommonLocationFormItems({nameState, setNameState, codeState, setCodeState, orderState, setOrderState, isActiveState, setIsActiveState, linkedLocation, submitingForm}) {
  return(<>
    <div className="d-flex column-gap-4 mt-2">
      <div className="d-flex w-50 flex-column row-gap-1">
        <label htmlFor="name">name</label>
        <input className="p-2" type="text" value={nameState} onChange={setNameState} name="name" id="name" placeholder="Los Angeles" />
      </div>
      <div className="d-flex w-50 flex-column row-gap-1">
        <label htmlFor="code">code</label>
        <input className="p-2" type="text" value={codeState} onChange={setCodeState} name="code" id="code" placeholder="LA" />
      </div>
    </div>

    <div className="d-flex column-gap-4 mt-2 align-items-end">
      <div className="d-flex w-50 flex-column row-gap-1">
        <label htmlFor="order">order <small className="text-muted">(lower comes first)</small></label>
        <input className="p-2" type="number" value={orderState} onChange={setOrderState} name="order" id="order" />
      </div>
      <label className="w-50 d-flex align-items-center column-gap-2 pb-2" htmlFor="isActive">
        <input type="checkbox" checked={isActiveState} onChange={setIsActiveState} name="isActive" id="isActive" />
        <span>active <small className="text-muted">(inactive ones are hidden from users)</small></span>
      </label>
    </div>

    <div className="w-25 mt-3">
      <button disabled={(submitingForm && submitingForm === 'add') || !linkedLocation || !nameState.trim() || !codeState.trim()} type="submit" className="btn btn-primary p-2 w-100">
        {submitingForm && submitingForm === 'add' ? <SyncOutlined spin /> : "add city"}
      </button>
    </div>
  </>)
}