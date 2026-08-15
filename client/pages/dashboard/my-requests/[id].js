import { getServerProps } from "@/lib/api"
import SingleRequest from "@/components/requests/SingleRequest"
import ServerProtectedDashboardLayout from "@/components/wrappers/users/ServerProtectedDashboardLayout"

export default function SingleRequestDashboardPage({data, user, error}) {

  return <SingleRequest Wrapper={ServerProtectedDashboardLayout} request={data} user={user} error={error} />

}

export const getServerSideProps = getServerProps('get-request');