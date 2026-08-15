import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout"

const Dashboard = () => {

    return (
        <ProtectedDashboardLayout>
            <h1>welcome to dashboard</h1>
        </ProtectedDashboardLayout>
    )
}

export default Dashboard
