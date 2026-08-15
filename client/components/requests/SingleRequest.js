import { trimChars } from "@/lib/strings";
import Image from "next/image"
import Link from "next/link"

const comp = ({children}) => <>{children}</>

export default function SingleRequest({error, request, user, Wrapper = comp}) {
  if(error || !request) {
    return (
      <Wrapper user={user}>
        <div className="pt-5 text-center">
          <h2>{error || "request not found"}</h2>
          <Link href="/dashboard/my-requests">back to my requests</Link>
        </div>
      </Wrapper>
    )
  }

  const hasImages = request.requestImages?.length > 0;

  return (
    <Wrapper user={user} >
      <div className="pt-5">
        <h1 className="text-center">{request.title}</h1>
        <div className="d-flex align-items-center justify-content-center mt-5 column-gap-2 px-4 py-2">
          {hasImages && request.requestImages.map(img => (
            <div key={img._id || img.url} className="p-1">
              {/* relative url, served through the /uploads proxy in both dev and production */}
              <Image className="rounded-4" width={200} height={200} src={img.url} alt={img.alt || request.title} unoptimized />
            </div>
          ))}
          {!hasImages && <Image width={200} height={200} src="/images/avatar.webp" alt="no image submitted for this request" />}
        </div>
        <div className="d-flex justify-content-between px-4 py-2 mt-2 column-gap-4">
          <div>category: <Link href={`/requests?category=${request.category._id}`}>{request.categorySlugPath}</Link></div>
          <div>status: {request.status}</div>
          <div>admin status: {request.adminStatus}</div>
        </div>
        <div className="d-flex px-4 py-2">
          request submited on : 
          <Link className="mx-2" href={`/requests?country=${request.location?.country?._id}`}>{request.location?.country?.name}</Link>
          - <Link className="mx-2" href={`/requests?province=${request.location?.province?._id}`}>{request.location?.province?.name}</Link>
          - <Link className="mx-2" href={`/requests?city=${request.location?.city?._id}`}>{request.location?.city?.name}</Link>
        </div>
        <div className="px-4 py-2">{request.description}</div>
        {request.requester === user._id && (
          <div className="px-2 pb-5">
            <Link className="btn btn-info text-white" href={`/dashboard/edit-request/${request._id}`}>edit this request</Link>
          </div>
        )}
        {request.requester !== user._id && user.role.includes('Provider') && (
          <div className="px-2 pb-5">
            <Link className="btn btn-success text-white" href={`/dashboard/submit-proposal/${request._id}`}>submit proposal</Link>
          </div>
        )}
        {request.requester === user._id && request.proposalCount > 0 && request.submitedProposals && request.submitedProposals.length > 0 && (
          <div className="mt-4">
            <p>submitted proposals:</p>
            <div className="mb-5">
              {request.submitedProposals.map(proposal => (
                <div className="border rounded-2 d-flex p-3">
                  <div>
                    <Image src={proposal.provider.avatar} width={150} height={150} />
                  </div>
                  <div className="d-flex flex-column justify-content-between flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <span>provider name: <strong>{proposal.provider.name}</strong></span>
                      <span>suggested price: <strong>{proposal.price}</strong></span>
                    </div>
                    <div className="my-2">{trimChars(proposal.proposalContent, 100)}</div>
                    <div><Link className="btn btn-danger" href={`/dashboard/proposal/${proposal._id}`}>see proposal</Link></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  )
}