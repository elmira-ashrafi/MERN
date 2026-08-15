import { getServerProps } from "@/lib/api"
import SingleRequest from "@/components/requests/SingleRequest"

export default function SingleRequestPublicPage({user, data, error}) {
  
  return (
    <SingleRequest user={user} request={data} error={error} />
  )
}

export const getServerSideProps = getServerProps('get-request')