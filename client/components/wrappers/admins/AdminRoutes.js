import Link from "next/link";
import { Menu } from "antd";
import {
  CoffeeOutlined,
  DollarOutlined,
  PlusCircleOutlined,
  EditFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

/*
 * The colour has to sit on the anchor itself. Bootstrap styles `a` directly, and an inherited
 * colour never beats a declaration the element already has — not even an !important one on an
 * ancestor, since !important only decides which rule wins on the element it is written for.
 */
const LINK = "text-white text-decoration-none";

export default function AdminRoutes({ children }) {
  const { pathname } = useRouter();

  const adminMenus = [
    {
      label: (
        <Link className={LINK} href="/admin/users">
          users
        </Link>
      ),
      key: "/admin/users",
      icon: <CoffeeOutlined />,
    },
    {
      label: (
        <Link className={LINK} href="/admin/requests">
          requests
        </Link>
      ),
      key: "/admin/requests",
      icon: <EditFilled />,
      children: [
      {
        label: <Link className={LINK} href="/admin/requests/category">categories</Link>,
        key: "/admin/requests/category",
      }
      ]
    },
    {
      label: (
        <Link className={`${LINK}`} href="/admin/locations">
          locations
        </Link>
      ),
      key: "/admin/locations",
      icon: <PlusCircleOutlined />,
      children: [
        {
          label: (
            <Link className={LINK} href="/admin/locations/countries">
              countries
            </Link>
          ),
          key: "/admin/locations/countries",
        },
        {
          label: (
            <Link className={LINK} href="/admin/locations/provinces">
              provinces
            </Link>
          ),
          key: "/admin/locations/provinces",
        },
        {
          label: (
            <Link className={LINK} href="/admin/locations/cities">
              cities
            </Link>
          ),
          key: "/admin/locations/cities",
        },
      ],
    },
    {
      label: (
        <Link className={LINK} href="/admin/proposals">
          proposals
        </Link>
      ),
      key: "/admin/proposals",
      icon: <ExclamationCircleOutlined />,
    },
    {
      label: (
        <Link className={LINK} href="/admin/provider-applications">
          provider-applications
        </Link>
      ),
      key: "/admin/provider-applications",
      icon: <DollarOutlined />,
    },
  ];

  // keep the locations group unfolded while the reader is anywhere inside it
  const openKeys = pathname.startsWith("/admin/locations")
    ? ["/admin/locations"]
    : [];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-2 bg-primary py-4 d-flex flex-column align-items-center rounded-end">
          <Menu
            items={adminMenus}
            mode="inline"
            selectedKeys={[pathname]}
            defaultOpenKeys={openKeys}
            classNames={{
              root: "bg-primary mw-100",
              item: "d-flex align-items-center py-4 px-1 fw-semibold text-white fs-5",
              itemIcon: "fs-5 text-white",
            }}
          />
        </div>
        <div className="col-md-10">{children}</div>
      </div>
    </div>
  );
}
