import { CustomerNav } from "~/components/customer/customer-nav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <CustomerNav />
      <main>{children}</main>
    </div>
  );
}
