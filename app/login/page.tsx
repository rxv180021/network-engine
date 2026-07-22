import Nav from "@/components/Nav";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="container" style={{ padding: "clamp(2.5rem,7vw,5rem) 0" }}>
        <LoginForm />
      </main>
    </>
  );
}
