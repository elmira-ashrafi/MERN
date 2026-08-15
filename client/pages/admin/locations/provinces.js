import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import Link from "next/link";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { apiFetch } from "@/lib/api";
import { handleFetch } from "@/lib/api";
import CountrySelect from "@/components/location/CountrySelect";
import LocationRow from "@/components/location/LocationRow";
import CommonLocationFormItems from "@/components/location/CommonLocationFormItems";
import NoCountry from "@/components/location/NoCountry";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

export default function AdminProvinces() {

    const [country, setCountry] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [order, setOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const [countries, setCountries] = useState([]);
    const [countriesSpinner, setCountriesSpinner] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [listSpinner, setListSpinner] = useState(false);
    const [submitingForm, setSubmitingForm] = useState(null);

    const [editingID, setEditingID] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingCode, setEditingCode] = useState("");
    const [editingOrder, setEditingOrder] = useState(0);
    const [editingIsActive, setEditingIsActive] = useState(null);
    const [editingCountry, setEditingCountry] = useState(null);

    // the admin list includes inactive countries, which the public endpoint hides
    useEffect(() => {
        handleFetch(setCountriesSpinner, '/api/admin/countries', {}, GLOBAL_FETCH_FAILURE, setCountries)
    }, [])

    const loadProvinces = selectedCountry => {
        if(!selectedCountry) return;

        handleFetch(setListSpinner, `/api/admin/provinces?country=${selectedCountry}`, {}, GLOBAL_FETCH_FAILURE, setProvinces)
    }

    useEffect(() => { loadProvinces(country) }, [country])

    // the stale list is dropped by the action that invalidates it, not by an effect watching it
    const handleCountryChange = value => {
        setCountry(value);
        setProvinces([]);

        setName('')
        setCode('')
        setOrder(0)
        setIsActive(true)

        setEditingID(null)
        setEditingName('')
        setEditingCode('')
        setEditingOrder(0)
        setEditingIsActive(null)
        setEditingCountry(null)
    }

    // const handleProvinceCountryChange = () =>

    const editBtn = (provinceId) => {
      const editingProvince = provinces.find((province) => province._id === provinceId);
      setEditingID(editingProvince._id)
      setEditingCode(editingProvince.code)
      setEditingName(editingProvince.name)
      setEditingOrder(editingProvince.order)
      setEditingIsActive(editingProvince.isActive)
      setEditingCountry(country)
    };

    const handleSubmit = async (e, mode= 'add') => {
        e.preventDefault();
        setSubmitingForm(mode);

        let fetchConfig = {};
        let path = '';

        if(mode === 'add') {
          path = '/api/admin/provinces';
          fetchConfig = {
            method: "POST",
            body: JSON.stringify({country, name, code, order, isActive})
          }
        } else {
          path = '/api/admin/provinces/' + editingID;
          fetchConfig = {
            method: "PATCH",
            body: JSON.stringify({country: editingCountry, name: editingName, code: editingCode, order: editingOrder, isActive: editingIsActive})
          }
        }

        try {
            const res = await apiFetch(path, fetchConfig);

            const {ok, message} = await res.json();

            if(!res.ok || !ok) {
                toast.error(message);
                return;
            }

            toast.success(`${message.name} has been added`);
            if(mode === 'add') {
              setName('');
              setCode('');
              setOrder(0);
              setIsActive(true);
            } else {
              setEditingID(null)
              setEditingName('')
              setEditingCode('')
              setEditingOrder(0)
              setEditingIsActive(null)
              setEditingCountry(null)
            }
            loadProvinces(country);

        } catch {
            toast.error(GLOBAL_FETCH_FAILURE);
        } finally {
            setSubmitingForm(false);
        }
    }

    return (
        <AdminOnly>
            <AdminRoutes>
                <div style={{width: '90%', margin: "60px auto"}} className="container">
                    <h1>provinces</h1>

                    <NoCountry spinner={countriesSpinner} countryList={countries} />

                    <form className="d-flex flex-column gap-2 border rounded-4 p-3 mt-3" onSubmit={handleSubmit}>
                        <h5 className="mb-2">add a new province</h5>

                        <div className="d-flex flex-column row-gap-1">
                            <label htmlFor="country">country</label>
                            <CountrySelect spinner={countriesSpinner} countries={countries} currentCountery={country} onChange={(e) => handleCountryChange(e.target.value)} />
                        </div>

                        <CommonLocationFormItems 
                          nameState={name} setNameState={e => setName(e.target.value)}
                          codeState={code} setCodeState={e => setCode(e.target.value)}
                          orderState={order} setOrderState={e => setOrder(e.target.value)}
                          isActiveState={isActive} setIsActiveState={e => setIsActive(e.target.checked)}
                          submitingForm={submitingForm} linkedLocation={country}
                        />
                    </form>

                    <h5 className="mt-4">provinces of the selected country</h5>
                    {!country && <p className="text-muted">select a country to see its provinces.</p>}
                    {country && listSpinner && <SyncOutlined spin className="fs-3" />}
                    {country && !listSpinner && provinces.length === 0 && <p className="text-muted">this country has no province yet.</p>}
                    {country && !listSpinner && provinces.length > 0 && (
                        <table className="table table-striped mt-2">
                            <thead>
                                <tr><th>name</th><th>code</th><th>order</th><th>status</th><th>actions</th>{editingID && <th>country</th>}</tr>
                            </thead>
                            <tbody>
                                {provinces.map(p=> (<>
                                  <LocationRow 
                                    key={p._id} location={p}
                                    editingID={editingID} editingName={editingName} editingCode={editingCode} editingIsActive={editingIsActive}
                                    onNameChange={(e) => setEditingName(e.target.value)}
                                    onOrderChange={(e) => setEditingOrder(e.target.value)}
                                    onCodeChange={(e) => setEditingCode(e.target.value)}
                                    onIsActiveChange={(e)=> setEditingIsActive(e.target.checked)}
                                    SelectComponent={CountrySelect}
                                    SelectComponentProps={ {countries, currentCountery: editingCountry, spinner: countriesSpinner, onChange: e => setEditingCountry(e.target.value)} }
                                    submitingForm={submitingForm} onSubmitForm={(e) => handleSubmit(e, "edit")}
                                    onEdit={() => editBtn(p._id)} onDelete={() => deleteBtn(p._id)  }
                                  />
                                </>))}
                            </tbody>
                        </table>
                    )}
                </div>
            </AdminRoutes>
        </AdminOnly>
    )
}
