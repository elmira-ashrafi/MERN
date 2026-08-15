import SingleProposal from "@/components/proposals/SingleProposal";
import { getServerProps } from "@/lib/api";

export default function singleProposalPage({data, user, error}) {
  return <SingleProposal data={data} user={user} error={error} />
}

export const getServerSideProps = getServerProps('get-proposal')