import { redirect } from "next/navigation";

export default function UploadRedirect() {
  redirect("/projects?tab=new");
}
