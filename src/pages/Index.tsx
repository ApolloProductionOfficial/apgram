import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import Hero from "@/components/Hero";
import TrafficSources from "@/components/TrafficSources";
import CTA from "@/components/CTA";
import AnimatedBackground from "@/components/AnimatedBackground";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <AnimatedBackground />
      <TopBanner />
      <Header />
      <Sidebar />
      <RightSidebar />
      <div className="lg:pl-80 xl:pr-80 pt-[92px]">
        <Hero />
        <TrafficSources />
        <CTA />
      </div>
    </div>
  );
};

export default Index;
