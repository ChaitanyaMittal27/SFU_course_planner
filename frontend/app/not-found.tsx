import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="max-w-[1180px] mx-auto px-4 sm:px-7 py-16 text-center"><h1 className="text-3xl font-semibold">Page not found</h1><p className="mt-3 text-text-muted">This course link is invalid or no longer available.</p><Link href="/browse"><Button className="mt-6">Browse courses</Button></Link></div>;
}
