import { useRouter } from "next/router";
import AuthOnly from "./AuthOnly";
import DashboardRoutes from "./DashboardRoutes";

export default function ServerProtectedDashboardLayout({user, children}) {

    const { pathname } = useRouter()

    return (
      <AuthOnly>
        <DashboardRoutes user={user} pathname={pathname}>
          {children}
        </DashboardRoutes>
      </AuthOnly>
    )
}