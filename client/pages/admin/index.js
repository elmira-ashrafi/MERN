import { useEffect, useState } from "react"
import Link from "next/link"
import { SyncOutlined } from "@ant-design/icons"
import AdminOnly from "@/components/wrappers/admins/AdminOnly"
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes"
import { apiFetch } from "@/lib/api"

export default function AdminHome() {

    const [pendingRequests, setPendingRequests] = useState(0);
    const [pendingApplications, setPendingApplications] = useState(0);
    const [users, setUsers] = useState(0);
    const [spinner, setSpinner] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [requestRes, applicationRes, userRes] = await Promise.all([
                    apiFetch('/api/admin/requests/counts'),
                    apiFetch('/api/admin/provider-applications?status=pending&limit=1'),
                    apiFetch('/api/admin/users?limit=1')
                ]);

                const [requestData, applicationData, userData] = await Promise.all([
                    requestRes.json(), applicationRes.json(), userRes.json()
                ]);

                if(requestRes.ok && requestData.ok) setPendingRequests(requestData.message.pending);
                if(applicationRes.ok && applicationData.ok) setPendingApplications(applicationData.total);
                if(userRes.ok && userData.ok) setUsers(userData.total);

            } catch {
                // the dashboard is a summary, a failure here is not worth a toast
            } finally {
                setSpinner(false);
            }
        })()
    }, [])

    const cards = [
        {label: "requests waiting for review", href: "/admin/requests", count: pendingRequests, urgent: pendingRequests > 0},
        {label: "provider applications waiting", href: "/admin/provider-applications", count: pendingApplications, urgent: pendingApplications > 0},
        {label: "registered users", href: "/admin/users", count: users, urgent: false}
    ];

    return (
        <AdminOnly>
            <AdminRoutes>
                <div style={{width: '95%', margin: "60px auto"}} className="container">
                    <h1>welcome to admin area</h1>

                    {spinner && <SyncOutlined spin className="fs-3 mt-4" />}

                    {!spinner && (
                        <div className="d-flex column-gap-3 mt-4">
                            {cards.map(card => (
                                <Link
                                    key={card.href}
                                    href={card.href}
                                    className={`border rounded-4 p-4 flex-fill text-center text-decoration-none ${card.urgent ? "border-danger" : ""}`}
                                >
                                    <div className={`fs-1 fw-bold ${card.urgent ? "text-danger" : ""}`}>{card.count}</div>
                                    <div className="fs-6">{card.label}</div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </AdminRoutes>
        </AdminOnly>
    )
}
