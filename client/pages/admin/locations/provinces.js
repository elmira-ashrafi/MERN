import { useEffect, useState } from "react";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { handleFetch } from "@/lib/api";
import LocationForm from "@/components/admin/LocationForm";
import LocationTable from "@/components/admin/LocationTable";
import CountrySelect from "@/components/location/CountrySelect";
import NoCountry from "@/components/location/NoCountry";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

export default function AdminProvinces() {

    const [country, setCountry] = useState('');

    const [countries, setCountries] = useState([]);
    const [countriesSpinner, setCountriesSpinner] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [listSpinner, setListSpinner] = useState(false);

    const [editingCountry, setEditingCountry] = useState();

    const loadCountries = () => {
      handleFetch(setCountriesSpinner, '/api/admin/countries', {}, GLOBAL_FETCH_FAILURE, setCountries)
    }

    const loadProvinces = selectedCountry => {
      if(!selectedCountry) return;

      handleFetch(setListSpinner, `/api/admin/provinces?country=${selectedCountry}`, {}, GLOBAL_FETCH_FAILURE, setProvinces)
    }
    
    useEffect(() => { loadCountries() }, [])

    useEffect(() => { 
      loadProvinces(country)
      setEditingCountry(country)
    }, [country])

    const handleCountryChange = value => {
        setCountry(value);
        setProvinces([]);
    }

    return (
        <AdminOnly>
            <AdminRoutes>
                <div style={{width: '90%', margin: "60px auto"}} className="container">
                    <h1>provinces</h1>

                    <NoCountry spinner={countriesSpinner} countryList={countries} />

                    <LocationForm 
                      locationType={"province"} loadLocationsList={() => loadProvinces(country)} 
                      extraFields={{country}} parentLocation={country}
                    >
                      <div className="d-flex  flex-column row-gap-1">
                        <label htmlFor="province">country</label>
                        <CountrySelect countries={countries} currentCountery={country} spinner={countriesSpinner} onChange={e => handleCountryChange(e.target.value)} />
                      </div>
                    </LocationForm>

                    <h5 className="mt-4">provinces of the selected country</h5>
                    <LocationTable 
                      locationList={provinces} loadLocationsList={() => loadProvinces(country)} 
                      locationType={"province"} listSpinner={listSpinner} parentLocation={country}
                      extraFields={{country: editingCountry}} setEditingParentLocation={setEditingCountry} >
                      <CountrySelect countries={countries} currentCountery={editingCountry} spinner={countriesSpinner} onChange={e => setEditingCountry(e.target.value)} />
                    </LocationTable>
                </div>
            </AdminRoutes>
        </AdminOnly>
    )
}
