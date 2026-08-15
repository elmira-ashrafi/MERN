import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import Link from "next/link";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { apiFetch } from "@/lib/api";
import { handleFetch } from "@/lib/api";
import ProvinceSelect from "@/components/location/ProvinceSelect";
import CountrySelect from "@/components/location/CountrySelect";
import LocationRow from "@/components/location/LocationRow";
import CommonLocationFormItems from "@/components/location/CommonLocationFormItems";
import NoCountry from "@/components/location/NoCountry";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

export default function AdminCities() {

    const [country, setCountry] = useState('');
    const [province, setProvince] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [order, setOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const [countries, setCountries] = useState([]);
    const [countriesSpinner, setCountriesSpinner] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [provincesSpinner, setProvincesSpinner] = useState(false);
    const [cities, setCities] = useState([]);
    const [listSpinner, setListSpinner] = useState(false);
    const [submitingForm, setSubmitingForm] = useState(null);

    const [editingID, setEditingID] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingCode, setEditingCode] = useState("");
    const [editingOrder, setEditingOrder] = useState(0);
    const [editingIsActive, setEditingIsActive] = useState(null);
    const [editingProvince, setEditingProvince] = useState(null);

    useEffect(() => {
        handleFetch(setCountriesSpinner, '/api/admin/countries', {}, GLOBAL_FETCH_FAILURE, setCountries)
    }, [])

    useEffect(() => {
        if(!country) return
        handleFetch(setProvincesSpinner, `/api/admin/provinces?country=${country}`, {}, GLOBAL_FETCH_FAILURE, setProvinces)
    }, [country])

    const loadCities = province => {
        if(!province) return;

        handleFetch(setListSpinner, `/api/admin/cities?province=${province}`, {}, GLOBAL_FETCH_FAILURE, setCities)
    }

    useEffect(() => { loadCities(province) }, [province])

    const handleProvinceChange = value => {
        setProvince(value);
        setCities([]);
    }

    /*
     * The dependent fields are cleared by the action that invalidates them rather than by an
     * effect watching the value — an effect would setState synchronously on every change.
     */
    const handleCountryChange = value => {
        setCountry(value);
        setProvince('');
        setProvinces([]);
        setCities([]);

        clearAddForm();
        clearEditForm();
    }

    const handleSubmit = async (e, mode = 'add') => {
        e.preventDefault();
        setSubmitingForm(mode);

        let path = ''
        let fetchConfig = {}

        if(mode === 'add') {
          path = '/api/admin/cities'
          fetchConfig.method = "POST"
          fetchConfig.body = JSON.stringify({province, name, code, order, isActive})
        } else {
          path = '/api/admin/cities/' + editingID
          fetchConfig.method = "PATCH"
          fetchConfig.body = JSON.stringify({province: editingProvince, name: editingName, code: editingCode, order: editingOrder, isActive: editingIsActive})
        }

        try {
          const res = await apiFetch(path, fetchConfig);

          const {ok, message} = await res.json();

          if(!res.ok || !ok) {
              toast.error(message);
              return;
          }

          toast.success(`${message.name} has been added`);
          if(mode === 'add') clearAddForm()
          else clearEditForm()
          loadCities(province);

        } catch {
          toast.error(GLOBAL_FETCH_FAILURE);
        } finally {
          setSubmitingForm(null);
        }
    }

    const editBtn = (cityId) => {
      const {_id, name, code, order, isActive} = cities.find(c => c._id === cityId)
      setEditingID(_id)
      setEditingName(name)
      setEditingCode(code)
      setEditingOrder(order)
      setEditingIsActive(isActive)
      setEditingProvince(province)
    }

    const clearAddForm = () => {
      setName('');
      setCode('');
      setOrder(0);
      setIsActive(true);
    }

    const clearEditForm = () => {
      setEditingID(null)
      setEditingName('')
      setEditingCode('')
      setEditingOrder(0)
      setEditingIsActive(null)
      setEditingProvince(null)
    }

    return (
      <AdminOnly>
        <AdminRoutes>
          <div style={{width: '90%', margin: "60px auto"}} className="container">
            <h1>cities</h1>

            <NoCountry spinner={countriesSpinner} countryList={countries} />

            <form className="d-flex flex-column gap-2 border rounded-4 p-3 mt-3" onSubmit={handleSubmit}>
              <h5 className="mb-2">add a new city</h5>

              <div className="d-flex column-gap-4">
                <div className="d-flex w-50 flex-column row-gap-1">
                  <label htmlFor="country">country</label>
                  <CountrySelect countries={countries} spinner={countriesSpinner} currentCountery={country} onChange={e => handleCountryChange(e.target.value)} />
                </div>
                <div className="d-flex w-50 flex-column row-gap-1">
                  <label htmlFor="province">province</label>
                  <ProvinceSelect country={country} provinces={provinces} currentProvince={province} spinner={provincesSpinner} onChange={e => handleProvinceChange(e.target.value)} />
                </div>
              </div>
              <CommonLocationFormItems 
                nameState={name} setNameState={e => setName(e.target.value)}
                codeState={code} setCodeState={e => setCode(e.target.value)}
                orderState={order} setOrderState={e => setOrder(e.target.value)}
                isActiveState={isActive} setIsActiveState={e => setIsActive(e.target.checked)}
                submitingForm={submitingForm} linkedLocation={province}
              />
            </form>

            <h5 className="mt-4">cities of the selected province</h5>
            {!province && <p className="text-muted">select a province to see its cities.</p>}
            {province && listSpinner && <SyncOutlined spin className="fs-3" />}
            {province && !listSpinner && cities.length === 0 && <p className="text-muted">this province has no city yet.</p>}
            {province && !listSpinner && cities.length > 0 && (
              <table className="table table-striped mt-2">
                <thead>
                  <tr><th>name</th><th>code</th><th>order</th><th>status</th><th>actions</th></tr>
                </thead>
                <tbody>
                  {cities.map(c => 
                    (<LocationRow 
                      key={c._id} location={c} 
                      editingID={editingID} editingName={editingName} editingCode={editingCode} editingIsActive={editingIsActive} editingOrder={editingOrder}
                      onNameChange={(e) => setEditingName(e.target.value)} 
                      onOrderChange={(e) => setEditingOrder(e.target.value)} 
                      onCodeChange={(e) => setEditingCode(e.target.value)} 
                      onIsActiveChange={(e)=> setEditingIsActive(e.target.checked)} 
                      SelectComponent={ProvinceSelect} 
                      SelectComponentProps={ {country, provinces, currentProvince: editingProvince, spinner: provincesSpinner, onChange: e => setEditingProvince(e.target.value)} }
                      submitingForm={submitingForm} onSubmitForm={(e) => handleSubmit(e, "edit")}
                      onEdit={() => editBtn(c._id)} onDelete={() => deleteBtn(c._id)  }
                    />)
                  )}
                </tbody>
              </table>
            )}
          </div>
        </AdminRoutes>
      </AdminOnly>
    )
}
