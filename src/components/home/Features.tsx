
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Shield, MessageSquare, Phone, Upload, 
  BarChart3, UserCheck, Lock, RefreshCw
} from "lucide-react";

const features = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "SMS Messaging",
    description: "Send SMS messages to individual contacts or groups with customizable sender IDs and detailed delivery reports.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Voice Calls",
    description: "Deliver automated voice calls for alerts, reminders, and notifications with text-to-speech capabilities.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: "Audio Messages",
    description: "Upload and send pre-recorded audio messages for marketing campaigns or important announcements.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Detailed Analytics",
    description: "Track delivery rates, engagement metrics, and performance statistics through an intuitive dashboard.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Enterprise Security",
    description: "End-to-end encryption, secure authentication, and comprehensive data protection measures.",
    color: "bg-jaylink-50 text-jaylink-600",
  },
  {
    icon: <UserCheck className="h-6 w-6" />,
    title: "Verified Delivery",
    description: "Confirm message reception with delivery receipts and status updates for all communications.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "API Integration",
    description: "Seamlessly integrate with your existing systems through our secure and well-documented API.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: "Scheduled Messages",
    description: "Plan and schedule your communications in advance for timely delivery when it matters most.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section id="features" className="py-24 bg-gray-50/50 dark:bg-gray-900">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl md:text-4xl font-bold mb-6 text-balance"
          >
            Comprehensive Communication Solutions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-gray-600 dark:text-gray-300 text-balance"
          >
            JayLink SMS provides powerful features designed to enhance your messaging capabilities
            while maintaining the highest standards of security and reliability.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-subtle hover-lift"
            >
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-5", feature.color)}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
