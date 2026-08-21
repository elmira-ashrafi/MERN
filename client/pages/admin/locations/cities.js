import { useEffect, useState } from "react";
import { SyncOutlined } from "@ant-design/icons";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { handleFetch } from "@/lib/api";
import LocationForm from "@/components/admin/LocationForm";
import LocationTable from "@/components/admin/LocationTable";
import CountrySelect from "@/components/location/CountrySelect";
import ProvinceSelect from "@/components/location/ProvinceSelect";
import NoCountry from "@/components/location/NoCountry";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

export default function AdminCities() {

  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');

  const [provinces, setProvinces] = useState([]);
  const [provincesSpinner, setProvincesSpinner] = useState(false);
  const [countries, setCountries] = useState([]);
  const [countriesSpinner, setCountriesSpinner] = useState(false);
  const [cities, setCities] = useState([]);
  const [listSpinner, setListSpinner] = useState(false);

  const [editingProvince, setEditingProvince] = useState(province);
  
  const loadCountries = () => {  
    handleFetch(setCountriesSpinner, "/api/admin/countries", {}, GLOBAL_FETCH_FAILURE, setCountries);
  };

  const loadProvinces = country => {
    if(!country) return;

    handleFetch(setProvincesSpinner, `/api/admin/provinces?country=${country}`, {}, GLOBAL_FETCH_FAILURE, setProvinces)
  }

  const loadCities = province => {
      if(!province) return;

      handleFetch(setListSpinner, `/api/admin/cities?province=${province}`, {}, GLOBAL_FETCH_FAILURE, setCities)
  }

  useEffect(() => { loadCountries() }, [])

  useEffect(() => { 
    loadProvinces(country);
    setEditingProvince(null);
  }, [country])

  useEffect(() => { 
    loadCities(province);
    setEditingProvince(province);
  }, [province])

  const handleProvinceChange = value => {
      setProvince(value);
      setCities([]);
  }

  const handleCountryChange = value => {
      setCountry(value);
      setProvince('');
      setProvinces([]);
      setCities([]);
  }

    return (
      <AdminOnly>
        <AdminRoutes>
          <div style={{width: '90%', margin: "60px auto"}} className="container">
            <h1>cities</h1>

            <NoCountry spinner={countriesSpinner} countryList={countries} />

            <LocationForm 
              locationType={"city"} loadLocationsList={() => loadCities(province)} 
              extraFields={{province}} parentLocation={province} 
            >
              <div className="d-flex column-gap-4 mt-2">
                <div className="d-flex w-50 flex-column row-gap-1">
                  <label htmlFor="province">country</label>
                  <CountrySelect countries={countries} currentCountery={country} spinner={countriesSpinner} onChange={e => handleCountryChange(e.target.value)} />
                </div>
                <div className="d-flex w-50 flex-column row-gap-1">
                  <label htmlFor="province">province</label>
                  <ProvinceSelect country={country} provinces={provinces} currentProvince={province} spinner={provincesSpinner} onChange={e => handleProvinceChange(e.target.value)} />
                </div>
              </div>
            </LocationForm>

            <h5 className="mt-4">cities of the selected province</h5>
            <LocationTable 
              locationList={cities} loadLocationsList={() => loadCities(province)} 
              locationType={"city"} listSpinner={listSpinner} parentLocation={province} 
              setEditingParentLocation={setEditingProvince} extraFields={{province: editingProvince}} 
            >
              <ProvinceSelect country={country} provinces={provinces} currentProvince={editingProvince} spinner={provincesSpinner} onChange={e => setEditingProvince(e.target.value)} />
            </LocationTable>
          </div>
        </AdminRoutes>
      </AdminOnly>
    )
}
