import { getServerProps } from "@/lib/api";
import useProposalForm from "@/hooks/useProposalForm";
import ProposalFormFields from "@/components/proposals/ProposalFormFields";
import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout";

export default function SubmitProposal({data, user, error}) {

  const proposalFormData = useProposalForm(user._id, data._id, data.requester, '/api/submit-proposal')

  return (
    <ProtectedDashboardLayout>
      <ProposalFormFields requestId={data._id} requestTitle={data.title} {...proposalFormData} />
    </ProtectedDashboardLayout>
  )
}

export const getServerSideProps = getServerProps('get-request')