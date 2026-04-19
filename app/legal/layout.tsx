import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background font-sans text-primary" style={{ zIndex: 0 }}>
      <Navbar />
      {children}
      <section className="relative border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md">
        <Footer />
      </section>
    </div>
  );
}
