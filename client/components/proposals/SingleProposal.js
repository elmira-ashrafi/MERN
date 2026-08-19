import ServerProtectedDashboardLayout from "@/components/wrappers/users/ServerProtectedDashboardLayout"
import { apiFetch } from "@/lib/api"
import { getErrorMessage } from "@/lib/strings"
import { SyncOutlined } from "@ant-design/icons"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"

export default function SingleProposal({data, user, error}) {
  
  const [spinner, setSpinner] = useState(false)

  const router = useRouter();

  useEffect(() => {
    if(!data.request) {
      toast.info("linked request has been removed")
    }
  }, [data])
  
  if(error || !data) {
    return (
      <ServerProtectedDashboardLayout user={user}>
        <div className="pt-5 text-center">
          <h2>{error || "request not found"}</h2>
          <Link href="/dashboard/my-requests">back to my requests</Link>
        </div>
      </ServerProtectedDashboardLayout>
    )
  }

  if(!data.request) {
    return (
      <ServerProtectedDashboardLayout user={user}>
        <div className="pt-5 text-center">
          <h2>linked request has been deleted!</h2>
          <p>you can remove your request now</p>
          <Link href="/dashboard/my-proposals">back to my proposals</Link>
        </div>
      </ServerProtectedDashboardLayout>
    )
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

  const acceptProposal = async e => {
    try {
      setSpinner(true);

      const fetchConfig = {
        method : "POST",
        body: JSON.stringify({proposal: data._id, request: data.request._id})
      }

      const res = await apiFetch('/api/accept-proposal', fetchConfig);
      const {ok, message} = await res.json();

      if(!res.ok || !ok) {
        toast.error(message);
        return;
      }

      toast.success("proposal accepted successfully");
      router.replace('/dashboard/proposal/' + data._id);

    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSpinner(false);
    }
  }

  const hasImages = data.proposalImages?.length > 0;

  return(
    <ServerProtectedDashboardLayout user={user} >
      <div className="container pt-5 px-2">
        <div className="row align-items-center justify-content-center mt-5 mx-0 py-2 imgWrap">
          {hasImages && data.proposalImages.map(img => (
            <div key={img._id || img.url} className="d-flex col-6 col-md-2 py-2 px-1">
              <Image className="rounded-4 mx-auto" width={200} height={200} src={img.url} alt={img.alt || data._id} unoptimized />
            </div>
          ))}
          {!hasImages && <Image width={200} height={200} src="/images/avatar.webp" alt="no image submitted for this request" />}
        </div>
        <div className="row justify-content-between py-2 mx-0 mt-2 info">
          <div className="col-12 col-md-4 d-flex ps-0">
            <span>related request: </span>
            <strong><Link href={`/requests/${data.request._id}`}>{data.request.title}</Link></strong>
          </div>
          <div className="col-6 col-md-4 d-flex justify-content-center">
            <span>price:</span>
            <span>{data.price}</span>
          </div>
          <div className="col-6 col-md-4 d-flex justify-content-end"><p>status:</p>{handleItemStatus(data.status)}</div>
        </div>
        <div className="py-2">{data.proposalContent}</div>
      </div>
      {String(user._id) === String(data.request?.requester) && !data.request?.acceptedProposal && (
        <div className="px-4">
          <button disabled={spinner} onClick={acceptProposal} className="btn btn-success mt-2">{spinner ? <SyncOutlined spin /> : "accept proposal"}</button>
        </div>
      )}
      <style jsx>{`
        @media (max-width: 991px) {
          .imgWrap {
            justify-content: flex-start !important;
          }
          
          .imgWrap :global(img) {
            max-width: 150px;
            max-height: 150px;
            aspect-ratio: 1/1;
          }

          .info > div:first-child{
            justify-content: center;
          }

          .info > div:nth-child(2){
            justify-content: start !important;
          }
        }
      `}</style>
    </ServerProtectedDashboardLayout>
  )
}