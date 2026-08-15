import Link from "next/link";
import Image from "next/image";
import { Button } from "antd";
import { SyncOutlined, CloseCircleOutlined } from "@ant-design/icons";

export default function ProposalFormFields({
  requestId, requestTitle,
  submitProposal, handleProposalImages, removeImage,
  proposalContent, proposalPrice, proposalImages, spinner,
  setProposalContent, setProposalPrice,
  }) {

  return (
    <form className="p-5" onSubmit={submitProposal}>
      <div className="d-flex column-gap-4 mt-2">
        <div className="w-50 d-flex flex-column justify-content-between">
          <p className="me-2 mb-1">you are submiting proposal on</p>
          <h5>
            <strong><Link href={`/requests/${requestId}`}>{requestTitle}</Link></strong>
            <span className="ms-2">request</span>
          </h5>
        </div>
        <div className="w-50">
          <label className="d-flex position-relative flex-column" htmlFor="price">
            <span className="mb-2">add your approximate price</span>
            <span className="position-absolute" style={{top: '55%', left: 10}}>$</span>
            <input className="ps-4" value={proposalPrice} onChange={e => setProposalPrice(e.target.value)} type="text" name="price" id="price" placeholder="50" />
          </label>
        </div>
      </div>
      <div className="d-flex my-5">
        <label className="d-flex flex-column" htmlFor="proposalImages">
          <span className="mb-2">add images to your proposal if needed</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleProposalImages} name="proposalImages" id="proposalImages" />
        </label>
        <div className="d-flex ps-5 column-gap-5">
          {proposalImages.map(img=> (
            <div className="position-relative" key={img.id}>
              <Button className="position-absolute end-0 me-2 mt-2" onClick={e=> removeImage(e, img)} icon={<CloseCircleOutlined />}/>
              <Image src={img.url} alt={img.alt} width={150} height={150} unoptimized />
            </div>
          ))}
        </div>
      </div>
      <div className="d-flex column-gap-4 mt-2">
        <div className="w-100">
          <label className="d-flex flex-column" htmlFor="content">
            <span className="mb-2">describe your proposal</span>
            <textarea className="p-2 rounded" rows={10} value={proposalContent} onChange={e => setProposalContent(e.target.value)} type="text" name="content" id="content" placeholder="describe briefly how you can meet requester needs..."></textarea>
          </label>
        </div>
      </div>
      <button type="submit" className="btn btn-primary text-white mt-3">{spinner ? <SyncOutlined spin /> : "submit"}</button>
    </form>
  )
}