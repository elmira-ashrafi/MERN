import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout"
import { handleFetch } from "@/lib/api"
import { SyncOutlined } from "@ant-design/icons"
import { useEffect, useState } from "react"

const Dashboard = () => {

  const [requestSpinner, setRequestSpinner] = useState(false)
  const [proposalSpinner, setProposalSpinner] = useState(false)
  const [requests, setRequests] = useState([])
  const [proposals, setProposals] = useState([])
  const globalFetchFailureMessage = 'failed to fetch data'

  useEffect(() => {
    (async () => {
      await Promise.all([
        handleFetch(setRequestSpinner, '/api/my-requests', {}, globalFetchFailureMessage, setRequests),
        handleFetch(setProposalSpinner, '/api/my-proposals', [], globalFetchFailureMessage, setProposals),
      ])
    })()
  }, [])

    return (
        <ProtectedDashboardLayout>
            <div className="row px-2 row-gap-2 justify-content-center column-gap-2">
              <h1>welcome to dashboard</h1>
              {requestSpinner ? <SyncOutlined spin /> : (
                <div className="col-12 col-md-3 d-flex flex-column align-items-center border bg-primary rounded-2 text-white p-2">
                  <strong>{requests.length}</strong>
                  <span>request(s) submitted</span>
                </div>
              )}
              {proposalSpinner ? <SyncOutlined spin /> : (
                <div className="col-12 col-md-3 d-flex flex-column align-items-center border bg-primary rounded-2 text-white p-2">
                  <strong>{proposals.length}</strong>
                  <span>proposal(s) appealed</span>
                </div>
              )}
            </div>
        </ProtectedDashboardLayout>
    )
}

export default Dashboard
