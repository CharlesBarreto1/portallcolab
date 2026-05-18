import { redirect } from "next/navigation";

export default function Home() {
  // O middleware já cuida da redirect, mas garantimos aqui também.
  redirect("/dashboard");
}
