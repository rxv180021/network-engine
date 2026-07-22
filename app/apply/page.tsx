import Nav from "@/components/Nav";
import ApplyForm from "@/components/ApplyForm";

export default function ApplyPage() {
  return (
    <>
      <Nav active="apply" />
      <main className="container" style={{ padding: "clamp(2.5rem,7vw,4.5rem) 0" }}>
        <ApplyForm />
      </main>
    </>
  );
}
