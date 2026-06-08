import { CustomerAuthGuard } from "~/components/customer/customer-auth-guard";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerAuthGuard>{children}</CustomerAuthGuard>;
}
