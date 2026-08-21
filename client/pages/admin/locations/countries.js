import { useEffect, useState } from "react";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { handleFetch } from "@/lib/api";
import LocationTable from "@/components/admin/LocationTable";
import LocationForm from "@/components/admin/LocationForm";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

export default function AdminCountries() {

  const [countries, setCountries] = useState([]);
  const [listSpinner, setListSpinner] = useState(false);

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

  return (
    <AdminOnly>
      <AdminRoutes>
        <div style={{ width: "90%", margin: "60px auto" }} className="container" >
          
          <h1>countries</h1>
          <LocationForm locationType={'country'} loadLocationsList={loadCountries} />

          <h5 className="mt-4">existing countries</h5>
          <LocationTable locationList={countries} loadLocationsList={loadCountries} locationType={"country"} listSpinner={listSpinner} />

        </div>
      </AdminRoutes>
    </AdminOnly>
  );
}
