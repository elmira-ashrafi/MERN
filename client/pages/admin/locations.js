import { useEffect, useState } from "react";
import Link from "next/link";
import { SyncOutlined } from "@ant-design/icons";
import AdminOnly from "@/components/wrappers/admins/AdminOnly.js";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes.js";
import { handleFetch } from "@/lib/api";

const GLOBAL_FETCH_FAILURE = "something went wrong! check your network connectivity";

export default function AdminLocations() {

    const [countries, setCountries] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [spinner, setSpinner] = useState(false);

    // no country/province filter, so these come back as the full collections
    useEffect(() => {
        handleFetch(setSpinner, '/api/admin/countries', {}, GLOBAL_FETCH_FAILURE, setCountries)
        handleFetch(() => {}, '/api/admin/provinces', {}, GLOBAL_FETCH_FAILURE, setProvinces)
        handleFetch(() => {}, '/api/admin/cities', {}, GLOBAL_FETCH_FAILURE, setCities)
    }, [])

    const levels = [
        {label: "countries", href: "/admin/locations/countries", count: countries.length},
        {label: "provinces", href: "/admin/locations/provinces", count: provinces.length},
        {label: "cities", href: "/admin/locations/cities", count: cities.length}
    ];

    return (
        <AdminOnly>
            <AdminRoutes>
                <div style={{width: '90%', margin: "60px auto"}} className="container">
                    <h1>location manager</h1>
                    <p className="text-muted">a city belongs to a province, and a province belongs to a country — so build them in that order.</p>

                    {spinner && <SyncOutlined spin className="fs-3" />}

                    {!spinner && (
                        <div className="d-flex column-gap-3 mt-4">
                            {levels.map(level => (
                                <Link key={level.href} href={level.href} className="border rounded-4 p-4 flex-fill text-center text-decoration-none">
                                    <div className="fs-1 fw-bold">{level.count}</div>
                                    <div className="fs-5">{level.label}</div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </AdminRoutes>
        </AdminOnly>
    )
}
