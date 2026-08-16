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
      <div className="container pt-5 px-2">
        <h1 className="text-center">{request.title}</h1>
        <div className="row align-items-center justify-content-center mt-5 py-2 imgWrap">
          {hasImages && request.requestImages.map(img => (
            <div key={img._id || img.url} className="col-6 col-md-2 py-2">
              <Image className="rounded-4" width={200} height={200} src={img.url} alt={img.alt || request.title} unoptimized />
            </div>
          ))}
          {!hasImages && <Image width={200} height={200} src="/images/avatar.webp" alt="no image submitted for this request" />}
        </div>
        <div className="row justify-content-between py-2 mt-2 info">
          <div className="col-12 col-md-4">category: <Link href={`/requests?category=${request.category._id}`}>{request.categorySlugPath}</Link></div>
          <div className="col-5 col-md-4 text-center">status: {request.status}</div>
          <div className="col-7 col-md-4 text-end">admin status: {request.adminStatus}</div>
        </div>
        <div className="d-flex py-2 location">
          <span>request submited on : </span>
          <div>
            <Link className="mx-2" href={`/requests?country=${request.location?.country?._id}`}>{request.location?.country?.name}</Link>
            - <Link className="mx-2" href={`/requests?province=${request.location?.province?._id}`}>{request.location?.province?.name}</Link>
            - <Link className="mx-2" href={`/requests?city=${request.location?.city?._id}`}>{request.location?.city?.name}</Link>
          </div>
        </div>
        <div className="py-2">{request.description}</div>
        {request.requester === user._id && (
          <div className="pb-5">
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
            <div className="container px-0 mb-5">
              {request.submitedProposals.map(proposal => (
                <div className="row border rounded-2 p-2">
                  <div className="d-flex col-12 col-md-2">
                    <Image className="mx-auto" src={proposal.provider.avatar} width={150} height={150} />
                  </div>
                  <div className="d-flex flex-column justify-content-between flex-grow-1 col-12 col-md-10 my-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <span>provider: <strong>{proposal.provider.name}</strong></span>
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
      <style jsx>{`
        @media (max-width: 991px) {
          .info > div.col-12 {
            text-align: center;
            margin-bottom: 10px;
          }

          .info > div.text-center {
            text-align: start !important;
          }

          .imgWrap {
            justify-content: flex-start !important;
          }
          
          .imgWrap :global(img) {
            max-width: 150px;
            max-height: 150px;
            aspect-ratio: 1/1;
          }

          .location {
            flex-direction: column;
          }

          .location > div > :global(a:first-child) {
            margin-left: 0 !important;
          }

        }
      `}</style>
    </Wrapper>
  )
}