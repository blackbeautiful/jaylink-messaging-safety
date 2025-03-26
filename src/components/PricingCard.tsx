
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PricingTier {
  name: string;
  description: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  link: string;
}

const tiers: PricingTier[] = [
  {
    name: "Starter",
    description: "Perfect for small businesses or individual use",
    price: "₦5,000",
    features: [
      "Up to 1,000 SMS messages",
      "Voice calls at ₦15/call",
      "Basic delivery reports",
      "Email support",
      "30-day message history",
    ],
    cta: "Get Started",
    link: "/register?plan=starter",
  },
  {
    name: "Professional",
    description: "Ideal for growing businesses with regular messaging needs",
    price: "₦15,000",
    features: [
      "Up to 5,000 SMS messages",
      "Voice calls at ₦12/call",
      "Audio message uploads",
      "Detailed analytics",
      "Priority support",
      "90-day message history",
      "Scheduled messaging",
    ],
    highlighted: true,
    cta: "Choose Professional",
    link: "/register?plan=professional",
  },
  {
    name: "Enterprise",
    description: "For organizations with high-volume requirements",
    price: "₦50,000",
    features: [
      "Up to 25,000 SMS messages",
      "Voice calls at ₦10/call",
      "Unlimited audio uploads",
      "Advanced reporting & API access",
      "Dedicated account manager",
      "1-year message history",
      "Custom sender IDs",
      "Bulk messaging capabilities",
    ],
    cta: "Contact Sales",
    link: "/#contact",
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl md:text-4xl font-bold mb-6 text-balance"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-gray-600 dark:text-gray-300 text-balance"
          >
            Choose the plan that fits your needs. All plans include access to our core platform features.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
              className={`relative rounded-2xl overflow-hidden hover-lift ${
                tier.highlighted
                  ? "ring-2 ring-jaylink-500 shadow-xl"
                  : "border border-gray-200 dark:border-gray-800 shadow-subtle"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 left-0 right-0 py-1.5 bg-jaylink-500 text-white text-xs font-semibold text-center">
                  MOST POPULAR
                </div>
              )}
              <div
                className={`p-8 ${
                  tier.highlighted ? "pt-10" : "pt-8"
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 min-h-[50px]">
                  {tier.description}
                </p>
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    /month
                  </span>
                </div>
                <Link to={tier.link}>
                  <Button
                    className={`w-full mb-8 ${
                      tier.highlighted
                        ? "bg-jaylink-600 hover:bg-jaylink-700"
                        : "bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600"
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </Link>
                <ul className="space-y-4">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 bg-jaylink-50 dark:bg-jaylink-900/20 rounded-2xl p-8 max-w-3xl mx-auto text-center"
        >
          <h3 className="text-xl font-semibold mb-4 text-jaylink-800 dark:text-jaylink-100">
            Need a custom solution?
          </h3>
          <p className="text-jaylink-600 dark:text-jaylink-300 mb-6">
            Contact our sales team for volume discounts and custom integrations tailored to your specific requirements.
          </p>
          <Link to="/#contact">
            <Button variant="outline" className="border-jaylink-200 text-jaylink-700 hover:bg-jaylink-100">
              Contact Us
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
