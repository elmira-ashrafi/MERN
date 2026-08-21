import { useEffect, useState } from "react";
import { SyncOutlined } from "@ant-design/icons"
import { locationsPluralMap } from "@/lib/config";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/strings";
import { apiFetch } from "@/lib/api";

export default function LocationForm({children, locationType, loadLocationsList, extraFields, parentLocation = true}) {
  
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [submitingForm, setSubmitingForm] = useState(false);

  const clearForm = () => {
    setName('');
    setCode('');
    setOrder(0);
    setIsActive(true);
  }

  const SubmitLocation = async (e) => {
    e.preventDefault();
    setSubmitingForm(true);

    const path = `/api/admin/${locationsPluralMap[locationType]['plural']}`;
    const fetchConfig = {
      method: "POST",
      body: JSON.stringify({ ...extraFields, name, code, order, isActive })
    };

    try {
      const res = await apiFetch(path, fetchConfig);

      const {ok, message} = await res.json();

      if(!res.ok || !ok) {
        toast.error(message);
        return;
      }

      toast.success(`${message.name} has been added`);
      clearForm()
      loadLocationsList()
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitingForm(false);
    }
  }

  useEffect(() => { clearForm() }, [parentLocation])
  
  return(<>
    <form className="d-flex flex-column gap-2 border rounded-4 p-3 mt-3" onSubmit={SubmitLocation}>
      <h5 className="mb-2">add a new {locationType}</h5>

      {children}

      <div className="d-flex column-gap-4 mt-2">
        <div className="d-flex w-50 flex-column row-gap-1">
          <label htmlFor="name">name</label>
          <input className="p-2" type="text" value={name} onChange={e=> setName(e.target.value)} name="name" id="name" placeholder="Los Angeles" />
        </div>
        <div className="d-flex w-50 flex-column row-gap-1">
          <label htmlFor="code">code</label>
          <input className="p-2" type="text" value={code} onChange={e => setCode(e.target.value)} name="code" id="code" placeholder="LA" />
        </div>
      </div>

      <div className="d-flex column-gap-4 mt-2 align-items-end">
        <div className="d-flex w-50 flex-column row-gap-1">
          <label htmlFor="order">order <small className="text-muted">(lower comes first)</small></label>
          <input className="p-2" type="number" value={order} onChange={e => setOrder(e.target.value)} name="order" id="order" />
        </div>
        <label className="w-50 d-flex align-items-center column-gap-2 pb-2" htmlFor="isActive">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} name="isActive" id="isActive" />
          <span>active <small className="text-muted">(inactive ones are hidden from users)</small></span>
        </label>
      </div>

      <div className="w-25 mt-3">
        <button disabled={(submitingForm) || !parentLocation || !name.trim() || !code.trim()} type="submit" className="btn btn-primary p-2 w-100">
          {submitingForm ? <SyncOutlined spin /> : `add ${locationType}`}
        </button>
      </div>
    </form>
  </>)
}