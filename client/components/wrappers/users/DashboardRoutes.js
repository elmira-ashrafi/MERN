import Link from "next/link";
import { Menu } from "antd"
import { CoffeeOutlined, DollarOutlined, PlusCircleOutlined, EditFilled, ExclamationCircleOutlined, FormOutlined } from "@ant-design/icons";
import Image from "next/image";

export default function DashboardRoutes ({children, user, pathname}) {

    const dashboardMenu = [
        {
            label: <Link href="/dashboard">Dashboard</Link>,
            key: '/dashboard',
            icon: <CoffeeOutlined />
        },
        {
            label: <Link href="/dashboard/edit-profile">Edit Profile</Link>,
            key: '/dashboard/edit-profile',
            icon: <EditFilled />
        },
        {
            label: <Link href="/dashboard/submit-request">submit Request</Link>,
            key: '/dashboard/submit-request',
            icon: <PlusCircleOutlined />
        },
        {
            label: <Link href="/dashboard/my-requests">My Requests</Link>,
            key: '/dashboard/my-requests',
            icon: <ExclamationCircleOutlined />
        },
        (!user?.role?.includes("Provider")) && {
            label: <Link href="/dashboard/become-provider">become provider</Link>,
            key: '/dashboard/become-provider',
            icon: <DollarOutlined />
        },
        (user?.role?.includes("Provider")) && {
            label: <Link href="/dashboard/my-proposals">My Proposals</Link>,
            key: '/dashboard/my-proposals',
            icon: <FormOutlined />
        }
    ].filter(Boolean);

    // a dynamic route resolves to its template ("/dashboard/my-requests/[id]"), so highlight the parent entry
    const selectedKey = dashboardMenu.find(item => item.key === pathname)?.key
        || dashboardMenu.filter(item => pathname?.startsWith(item.key + "/")).sort((a, b) => b.key.length - a.key.length)[0]?.key;

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-md-2 bg-primary py-4 d-flex flex-column align-items-center rounded-end">
                    <Image className="rounded-circle mb-2" src="/images/avatar.webp" width={120} height={120} alt="avatar" />
                    <Menu items={dashboardMenu} selectedKeys={selectedKey ? [selectedKey] : []} classNames={{root: "bg-primary", item: "d-flex align-items-center py-4 px-1 fw-semibold text-white fs-4", itemIcon: "fs-4"}}  />
                </div>
                <div className="col-md-10">{children}</div>
            </div>
        </div>
    )
}
