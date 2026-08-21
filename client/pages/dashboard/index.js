import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout"
import { handleFetch } from "@/lib/api"
import { SyncOutlined } from "@ant-design/icons"
import { useEffect, useState } from "react"
import Link from "next/link"

const Dashboard = () => {

  const [spinner, setspinner] = useState(false)
  const [providerApplications, setProviderApplications] = useState([])
  const [requests, setRequests] = useState([])
  const [proposals, setProposals] = useState([])
  const globalFetchFailureMessage = 'failed to fetch data'

  useEffect(() => {
    (async () => {
      await Promise.all([
        handleFetch(setspinner, '/api/my-requests', {}, globalFetchFailureMessage, setRequests),
        handleFetch(setspinner, '/api/my-proposals', {}, globalFetchFailureMessage, setProposals),
        handleFetch(setspinner, '/api/provider-application', {}, globalFetchFailureMessage, setProviderApplications),
      ])
    })()
  }, [])

  const cards = [
    {label: "requests you submited", href: "/dashboard/my-requests", count: requests.length},
    {label: "proposals you offered", href: "/dashboard/my-proposals", count: proposals.length},
    {label: "applications to be provider", href: "/dashboard/become-provider", count: providerApplications.length}
  ];

    return (
        <ProtectedDashboardLayout>
            <div className="row px-2 row-gap-2 justify-content-center column-gap-2">
              <h1>welcome to dashboard</h1>
              {spinner && <SyncOutlined spin className="fs-3 mt-4" />}

              {!spinner && (
                <div className="d-flex column-gap-3 mt-4">
                  {cards.map(card => (
                    <Link
                      key={card.href}
                      href={card.href}
                      className={`border rounded-4 p-4 flex-fill text-center text-decoration-none`}
                    >
                      <div className={`fs-1 fw-bold`}>{card.count}</div>
                      <div className="fs-6">{card.label}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </ProtectedDashboardLayout>
    )
}

export default Dashboard
