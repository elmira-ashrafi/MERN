import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout";
import { apiFetch } from "@/lib/api";
import { handleFetch } from "@/lib/api";
import { SyncOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const STATUS_LABELS = {
    pending: "your application is being reviewed",
    approved: "your application has been approved",
    rejected: "your application was rejected. you can apply again"
};

const BecomeProvider = () => {

    const [userCategoryType, setUserCategoryType] = useState('');
    const [userFields, setUserFields] = useState([]);
    const [existingCats, setExistingCats] = useState([]);
    const [catsSpinner, setCatsSpinner] = useState(false);

    const [userCountry, setUserCountry] = useState('');
    const [existingCountries, setExistingCountries] = useState([]);
    const [existingCountriesSpinner, setExistingCountriesSpinner] = useState(false);
    const [userProvince, setUserProvince] = useState('');
    const [existingProvinces, setExistingProvinces] = useState([]);
    const [existingProvincesSpinner, setExistingProvincesSpinner] = useState(false);
    const [userCity, setUserCity] = useState('');
    const [existingCities, setExistingCities] = useState([]);
    const [existingCitiesSpinner, setExistingCitiesSpinner] = useState(false);

    const [userDocs, setUserDocs] = useState([]);
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [btnSpinner, setBtnSpinner] = useState(false);

    const globalFetchFailureMsg = "something went wrong! check your network connectivity";

    // the category list is one flat collection, filtered client side by product/service
    const availableFields = existingCats.filter(cat => cat.type === userCategoryType);

    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch('/api/provider-application');
                const {ok, message} = await res.json();
                if(res.ok && ok) setApplication(message);
            } catch {
                // a missing application is not an error worth interrupting the user for
            } finally {
                setLoading(false);
            }
        })()
    }, [])

    useEffect(() => {
        handleFetch(setCatsSpinner, '/api/get-cats', {}, globalFetchFailureMsg, setExistingCats)
        handleFetch(setExistingCountriesSpinner, '/api/get-countries', {}, globalFetchFailureMsg, setExistingCountries)
    }, [])

    useEffect(() => {
        if(!userCountry) return

        handleFetch(
            setExistingProvincesSpinner,
            `/api/get-provinces/${userCountry}`,
            {},
            globalFetchFailureMsg,
            setExistingProvinces
        )
    }, [userCountry])

    useEffect(() => {
        if(!userProvince) return

        handleFetch(
            setExistingCitiesSpinner,
            `/api/get-cities/${userProvince}`,
            {},
            globalFetchFailureMsg,
            setExistingCities
        )
    }, [userProvince])

    /*
     * The dependent fields are cleared by the action that invalidates them rather than by an
     * effect watching the value — an effect would setState synchronously on every change.
     */
    const handleCountryChange = value => {
        setUserCountry(value);
        setUserProvince('');
        setUserCity('');
        setExistingProvinces([]);
        setExistingCities([]);
    }

    const handleProvinceChange = value => {
        setUserProvince(value);
        setUserCity('');
        setExistingCities([]);
    }

    //switching between product and service invalidates the fields picked under the previous one
    const handleCategoryType = e => {
        setUserCategoryType(e.target.value);
        setUserFields([]);
    }

    const toggleField = (e, id) => {
        setUserFields(prev => e.target.checked ? [...prev, id] : prev.filter(field => field !== id));
    }

    const handleProviderConversion = async e => {
        e.preventDefault();
        setBtnSpinner(true);

        try {
            const formData = new FormData();

            formData.append('userCountry', userCountry);
            formData.append('userProvince', userProvince);
            formData.append('userCity', userCity);
            userFields.forEach(field => formData.append('businessCategories', field));
            userDocs.forEach(doc => formData.append('businessDocs', doc));

            const res = await apiFetch('/api/provider-application', {method: "POST", body: formData});
            const {ok, message} = await res.json();

            if(!res.ok || !ok) {
                toast.error(message);
                return;
            }

            toast.success(message);
            setApplication({status: "pending"});

        } catch {
            toast.error(globalFetchFailureMsg);
        } finally {
            setBtnSpinner(false);
        }
    }

    const canSubmit = userCategoryType && userFields.length > 0 && userCountry && userProvince && userCity && userDocs.length > 0;

  if(loading) {
    return (
      <ProtectedDashboardLayout>
        <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>
      </ProtectedDashboardLayout>
    )
  }

  if(application && application.status !== "rejected") {
    return (
      <ProtectedDashboardLayout>
        <div className="container col-12 col-md-6 border rounded p-4 my-5 text-center">
          <h1 className="pt-2">become a provider</h1>
          <p className="mt-3">{STATUS_LABELS[application.status]}</p>
          {application.adminNote && <p className="text-muted">note from the admins: {application.adminNote}</p>}
        </div>
      </ProtectedDashboardLayout>
    )
  }

  return (
    <ProtectedDashboardLayout>
      <div className="container px-2">
        <div className="col-12 row border rounded p-2 my-5">
          <h1 className="pt-4 px-0 text-center">tell us about your field</h1>
          {application?.status === "rejected" && (
            <p className="text-danger">{STATUS_LABELS.rejected}{application.adminNote ? ` — ${application.adminNote}` : ''}</p>
          )}
          <form className="d-flex flex-column gap-2 px-0" onSubmit={handleProviderConversion}>

            <div className="d-flex row-gap-1 flex-column">
              <p className="mb-0" >what would you offer to your customers?</p>
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center px-2">
                  <label htmlFor="product">Product</label>
                  <input className="ms-1 mt-1" value="product" checked={userCategoryType === 'product'} onChange={handleCategoryType} type="radio" name="userCategoryType" id="product" />
                </div>
                <div className="d-flex align-items-center px-2">
                  <label htmlFor="service">Service</label>
                  <input className="ms-1 mt-1" value="service" checked={userCategoryType === 'service'} onChange={handleCategoryType} type="radio" name="userCategoryType" id="service" />
                </div>
              </div>
            </div>

            <div className="d-flex row-gap-1 flex-column mt-2">
              {userCategoryType && (
                <>
                <p className="mb-0" >select your fields</p>
                {catsSpinner && <SyncOutlined spin />}
                {!catsSpinner && availableFields.length === 0 && <span className="text-muted">no field available in this category yet</span>}
                {!catsSpinner && availableFields.map(field => (
                  <label key={field._id} htmlFor={field._id}>
                    <input className="me-1" type="checkbox" checked={userFields.includes(field._id)} name="businessCategories" value={field._id} id={field._id} onChange={e => toggleField(e, field._id)} />
                    {field.name}
                  </label>
                ))}
                </>
              )}
            </div>

            <div className="d-flex row-gap-1 flex-column mt-2">
              <p className="mb-0">where is your business?</p>

              <label htmlFor="country">country</label>
              {existingCountriesSpinner && !existingCountries.length && <SyncOutlined spin />}
              {existingCountries.length > 0 && (
                <select className="p-2" value={userCountry} onChange={e => handleCountryChange(e.target.value)} name="country" id="country">
                  <option value="">select your country</option>
                  {existingCountries.map(country => <option key={country._id} value={country._id}>{country.name}</option>)}
                </select>
              )}

              <label className="mt-2" htmlFor="province">province</label>
              {existingProvincesSpinner && userCountry && !existingProvinces.length && <SyncOutlined spin />}
              <select className="p-2" value={userProvince} onChange={e => handleProvinceChange(e.target.value)} name="province" id="province" disabled={!userCountry}>
                <option value="">{userCountry ? "select your province" : "select your country first"}</option>
                {existingProvinces.map(province => <option key={province._id} value={province._id}>{province.name}</option>)}
              </select>

              <label className="mt-2" htmlFor="city">city</label>
              {existingCitiesSpinner && userProvince && !existingCities.length && <SyncOutlined spin />}
              <select className="p-2" value={userCity} onChange={e => setUserCity(e.target.value)} name="city" id="city" disabled={!userProvince}>
                <option value="">{userProvince ? "select your city" : "select your province first"}</option>
                {existingCities.map(city => <option key={city._id} value={city._id}>{city.name}</option>)}
              </select>
            </div>

            <div className="d-flex row-gap-1 flex-column mt-3">
              <label htmlFor="businessDocs">upload your business documents (pdf or image, up to 10)</label>
              <input
                type="file"
                multiple
                id="businessDocs"
                name="businessDocs"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={e => setUserDocs(Array.from(e.target.files || []).slice(0, 10))}
              />
              {userDocs.length > 0 && <small className="text-muted">{userDocs.length} file(s) selected</small>}
            </div>

            <button disabled={!canSubmit || btnSpinner} type="submit" className="btn btn-block btn-primary p-2 mt-3">
              {btnSpinner ? <SyncOutlined spin /> : "submit"}
            </button>
          </form>
        </div>
      </div>
    </ProtectedDashboardLayout>
  )
}

export default BecomeProvider;
