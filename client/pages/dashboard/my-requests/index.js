import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout";
import { Context } from "@/context/auth";
import { apiFetch, handleFetch } from "@/lib/api";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { trimChars } from "@/lib/strings";

const MyRequests = () => {

  const {state: {user}} = useContext(Context);

  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinner, setSpinner] = useState(false);

  useEffect( ()=> {

    if(!user) return
    
    handleFetch(setLoading, '/api/my-requests', {}, 'something went wrong! please check your network connectivity', setUserRequests)

  }, [user])

  const deleteRequest = async (_id) => {
    setSpinner(true);

    try {
      const deleteConfig = {
        method: "POST",
        body: JSON.stringify({_id})
      }

      const res = await apiFetch('/api/delete-request', deleteConfig);
      const {ok, message} = await res.json()

      if(!res.ok || !ok) {
        toast.error(message)
      } else {
        toast.success(message);
        handleFetch(setLoading, '/api/my-requests', {}, 'something went wrong! please check your network connectivity', setUserRequests)
      }
    } catch {
      toast.error("something went wrong! please try again");
    } finally {
      setSpinner(false)
    }
  }

  const handleAdminStatus = (adminStatus) => {
    switch(adminStatus) {
      case "pending" :
        return <p className="text-center bg-info text-white px-4 py-1 rounded mx-auto mb-0">waiting for admins confirmation</p>
      case "approved" :
        return <p className="text-center bg-success text-white px-4 py-1 rounded mx-auto mb-0">confirmed by admin</p>
      case "rejected" :
        return <p className="text-center bg-danger text-white px-4 py-1 rounded mx-auto mb-0">rejected by admins</p>
      default:
        return null;
    }
  }

  const handleItemStatus = (reqStatus) => {
    switch(reqStatus) {
      case 'open':
        return <p className="fw-bold ms-1 mb-0 text-info">{reqStatus}</p>;
      case 'assigned':
        return <p className="fw-bold ms-1 mb-0 text-success">{reqStatus}</p>;
      case 'close':
        return <p className="fw-bold ms-1 mb-0 text-danger">{reqStatus}</p>;
      default:
        return null;
    }
  }

  return (
    <ProtectedDashboardLayout>
      <div className="container border rounded-3 p-2 my-5 mx-auto col-12 position-relative">
        <h1>requests submited by you</h1>
        {spinner && <div className="position-absolute d-flex justify-content-center align-items-center end-0 start-0 top-0 bottom-0 bg-white opacity-75" ><SyncOutlined spin className="fs-1" /></div>}

        {loading && <div className="text-center py-5"><SyncOutlined spin className="fs-1" /></div>}

        {userRequests.map(req=> (
          <div key={req._id} className="row p-2 mx-0 border rounded-4 mb-2">
            <div className="col-12 col-md-3 d-flex justify-content-center align-items-center">
              <Image
                className="rounded-4"
                width={200}
                height={200}
                src={req.requestImages?.[0]?.url || "/images/avatar.webp"}
                alt={req.requestImages?.[0]?.alt || req.title}
                unoptimized={Boolean(req.requestImages?.[0]?.url)}
              />
            </div>
            <div className="row col-12 col-md-9 my-4 row-gap-3">
              <div className="col-12 col-md-6 d-flex row-gap-2 flex-column justify-content-around">
                <h3 className="mb-0"><Link href={`/dashboard/my-requests/${req._id}`}>{trimChars(req.title)}</Link></h3>
                <div className="d-flex">status: {handleItemStatus(req.status)}</div>
                <p className="d-flex column-gap-1">
                  <span>category:</span>
                  <Link className="d-flex flex-column align-items-center" href={`/requests?category=${req.category}`}>{req.categorySlugPath}</Link>
                </p>
              </div>
              <div className="col-12 col-md-6 d-flex row-gap-2 flex-column align-items-center justify-content-around">
                {handleAdminStatus(req.adminStatus)}
                <span>proposals submited on this reuqest: {req.proposalCount}</span>
                <div className="d-flex column-gap-2">
                  <div role="button" onClick={()=> deleteRequest(req._id)} className="bg-danger rounded px-3 py-2 text-white fw-semibold">delete</div>
                  <Link href={`/dashboard/edit-request/${req._id}`} className="bg-info rounded px-3 py-2 text-white fw-semibold text-decoration-none">edit</Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && userRequests.length === 0 && <h2 className="mt-5 text-center">no request submited yet</h2>}
      </div>
    </ProtectedDashboardLayout>
  )
}

export default MyRequests
