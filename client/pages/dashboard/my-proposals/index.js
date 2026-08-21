import { useContext, useEffect, useState } from "react"
import { Context } from "@/context/auth"
import { handleFetch } from "@/lib/api";
import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout"
import { SyncOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { getErrorMessage, trimChars } from "@/lib/strings";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/router";
import { Spin } from "antd";

const MyProposals = () => {

  const {state: {user}} = useContext(Context);

  const router = useRouter();

  const [loading, setLoading] = useState(false)
  const [proposals, setProposals] = useState([])
  const [spinner, setSpinner] = useState(false)

  useEffect(() => {

    if(!user) return;

    if(!user.role.includes("Provider")) {
      toast.error("you should be a provider to have proposals");
      router.replace('/dashboard/become-provider');
    }

  }, [user, router])

  useEffect(() => {
    if(!user) return;
    handleFetch(setLoading, '/api/my-proposals', {}, 'something went wrong! please check your connectivity', setProposals);
  }, [user])

  const deleteProposal = async (_id) => {
    setSpinner(true);
    
    try {
      const deleteConfig = {
        method: "POST",
        body: JSON.stringify({_id})
      }

      const res = await apiFetch('/api/delete-proposal', deleteConfig);
      const {ok, message} = await res.json()

      if(!res.ok || !ok) {
        toast.error(message)
      } else {
        toast.success(message);
        handleFetch(setLoading, '/api/my-proposals', {}, 'something went wrong! please check your connectivity', setProposals);
      }
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSpinner(false)
    }
  }

  const handleItemStatus = (reqStatus) => {
    switch(reqStatus) {
      case 'pending':
        return <p className="fw-bold ms-1 mb-0 text-info">{reqStatus}</p>;
      case 'accepted':
        return <p className="fw-bold ms-1 mb-0 text-success">{reqStatus}</p>;
      case 'rejected':
        return <p className="fw-bold ms-1 mb-0 text-danger">{reqStatus}</p>;
      case 'withdrawn': 
        return <p className="fw-bold ms-1 mb-0 text-primary">{reqStatus}</p>;
      default:
        return null;
    }
  }

  if(!user?.role?.includes("Provider")) return <Spin fullscreen />

  return (
    <ProtectedDashboardLayout>
      <div style={{border: "1px solid rgba(0, 0, 0, 0.2)", padding: "20px", borderRadius: "8px", width: '80%', margin: "100px auto"}} className="container position-relative">
        <h1>proposals submited by you</h1>
        {spinner && <div className="position-absolute d-flex justify-content-center align-items-center end-0 start-0 top-0 bottom-0 bg-white opacity-75" ><SyncOutlined spin className="fs-1" /></div>}

        {loading && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

        {proposals.map(proposal=>(
          <div key={proposal._id} className="d-flex border rounded-4 p-2 px-3 mb-2">
            <div className=" d-flex justify-content-center align-items-center">
              <Image
                className="rounded-4"
                width={200}
                height={200}
                src={proposal.proposalImages?.[0]?.url || "/images/avatar.webp"}
                alt={proposal.proposalImages?.[0]?.alt || proposal._id}
                unoptimized={Boolean(proposal.proposalImages?.[0]?.url)}
              />
            </div>
            <div className="d-flex justify-content-around w-100 ps-4">
              <div className="d-flex flex-column justify-content-around my-2">
                <h3 className="mb-0"><Link href={`/dashboard/my-proposals/${proposal._id}`}>{trimChars(proposal.proposalContent)}</Link></h3>
                <div className="d-flex">status: {handleItemStatus(proposal.status)}</div>
              </div>
              <div className="d-flex flex-column align-items-center justify-content-around mb-2 mt-4">
                <p><span>price:</span><span>{proposal.price}</span></p>
                <div className="d-flex column-gap-2">
                  <div role="button" onClick={()=> deleteProposal(proposal._id)} className="bg-danger rounded px-3 py-2 text-white fw-semibold">delete</div>
                  <Link href={`/dashboard/edit-proposal/${proposal._id}`} className="bg-info rounded px-3 py-2 text-white fw-semibold text-decoration-none">edit</Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && proposals.length === 0 && <h2 className="mt-5 text-center">no proposal submited yet</h2>}
      </div>
    </ProtectedDashboardLayout>
  )
}

export default MyProposals
