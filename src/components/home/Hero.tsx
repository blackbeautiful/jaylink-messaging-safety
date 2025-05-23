
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <section className="relative pt-28 pb-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-jaylink-50/60 to-transparent opacity-70 pointer-events-none -z-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-jaylink-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-jaylink-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
      
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            custom={0}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider text-jaylink-700 uppercase bg-jaylink-100 rounded-full"
          >
            Secure Messaging Solutions
          </motion.div>
          
          <motion.h1
            custom={1}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 text-balance"
          >
            Connect with confidence through{" "}
            <span className="text-jaylink-600">JayLink SMS</span>
          </motion.h1>
          
          <motion.p
            custom={2}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-balance"
          >
            Send SMS, make voice calls, and deliver audio messages with enterprise-grade security. 
            Our cutting-edge platform ensures your communications are always reliable, secure, and cost-effective.
          </motion.p>
          
          <motion.div
            custom={3}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button className="w-full sm:w-auto min-w-[140px] bg-jaylink-600 hover:bg-jaylink-700 text-white px-6 py-6 rounded-lg text-lg transition-all shadow-md hover:shadow-lg">
                Get Started
              </Button>
            </Link>
            <Link to="/#features">
              <Button variant="outline" className="w-full sm:w-auto min-w-[140px] border-jaylink-200 text-jaylink-700 hover:bg-jaylink-50 px-6 py-6 rounded-lg text-lg">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
        
        <motion.div
          custom={4}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-elevated">
            <div className="absolute inset-0 bg-gradient-to-b from-jaylink-100/50 to-jaylink-200/30 backdrop-blur-sm"></div>
            <div className="glass-effect relative rounded-2xl overflow-hidden p-1">
              {/* Dashboard preview image would go here */}
              <div className="aspect-video w-full rounded-xl bg-jaylink-50/80 flex items-center justify-center">
                <div className="text-center px-6 py-20 max-w-lg mx-auto">
                  <h3 className="text-xl font-medium text-jaylink-800 mb-4">
                    Powerful Dashboard
                  </h3>
                  <p className="text-jaylink-600 mb-6">
                    Manage your communications, track deliveries, and analyze performance with our intuitive dashboard
                  </p>
                  <div className="flex justify-center gap-4">
                    <div className="h-12 w-32 bg-white rounded-md shadow-sm"></div>
                    <div className="h-12 w-32 bg-white rounded-md shadow-sm"></div>
                    <div className="h-12 w-32 bg-white rounded-md shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
