import { getServerProps } from "@/lib/api";
import useProposalForm from "@/hooks/useProposalForm";
import ProposalFormFields from "@/components/proposals/ProposalFormFields";
import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout";

export default function EditProposal({data, user, error}) {

  if(error || !user) {
    return (
      <div><h2 className="text-center">proposal not found</h2></div>
    )
  }

  const proposalFormData = useProposalForm(user._id, data.request._id, data.request.requester, `/api/edit-proposal/${data._id}`, data.proposalContent, data.price, data.proposalImages, "PATCH")

  return (
    <ProtectedDashboardLayout>
      <ProposalFormFields requestId={data.request._id} requestTitle={data.request.title} {...proposalFormData} />
    </ProtectedDashboardLayout>
  )
}

export const getServerSideProps = getServerProps('get-proposal')