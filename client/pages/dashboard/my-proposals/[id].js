import { getServerProps } from "@/lib/api"
import SingleProposal from "@/components/proposals/SingleProposal"

export default function MyProposal({data, user, error}) {
  return <SingleProposal data={data} user={user} error={error} />
}

export const getServerSideProps = getServerProps('get-proposal')