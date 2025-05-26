import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MessageSquare,
  PhoneCall,
  Mail,
  Send,
  Loader2,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const Support = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [activeTab, setActiveTab] = useState('contact');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate the form
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Your message has been sent. We'll get back to you soon!");
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    }, 1500);
  };

  // FAQ data
  const faqs = [
    {
      question: "How do I send SMS messages?",
      answer:
        "To send SMS messages, navigate to the 'Send Message' page from the dashboard. Enter the recipient(s) phone number(s), write your message, and click 'Send Message'. You can also schedule messages for later delivery by enabling the 'Schedule for later' option.",
    },
    {
      question: "How do I make voice calls?",
      answer:
        "To make voice calls, go to the 'Voice Calls' page from the dashboard. Enter the recipient(s) phone number(s), select your caller ID, and choose between text-to-speech or an audio file. For text-to-speech, type your message; for audio, upload your file. Click 'Start Voice Call' to initiate.",
    },
    {
      question: "How do I top up my balance?",
      answer:
        "Click the 'Top Up' button in the top-right corner of the dashboard. Enter the amount you wish to add to your account and select your preferred payment method. Follow the instructions to complete the payment process.",
    },
    {
      question: "How do I create and manage contact groups?",
      answer:
        "Navigate to the 'Groups' page to create and manage your contact groups. Click 'Add Group' to create a new group or select an existing group to edit. You can add contacts individually or import them from a CSV file.",
    },
    {
      question: "What are the pricing details?",
      answer:
        "SMS messages are charged at ₦3 per unit, with one unit equaling 160 characters. Voice calls are charged at ₦15 per minute. Bulk messages and calls receive discounted rates based on volume. Check the 'Balance' page for detailed pricing information.",
    },
    {
      question: "How do I track message delivery?",
      answer:
        "All message delivery statuses are available in the 'Analytics' section. You can see delivery reports, including the number of successful deliveries, failed attempts, and pending messages. Detailed reports can be exported for your records.",
    },
  ];

  return (
    <DashboardLayout title="Help & Support" backLink="/dashboard" currentPath={location.pathname}>
      <div className="max-w-6xl mx-auto">
        <Tabs
          defaultValue="contact"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8">
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="faq">FAQs</TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="md:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Get in Touch</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="What is this regarding?"
                          value={formData.subject}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2 mb-6">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="How can we help you?"
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-jaylink-600 hover:bg-jaylink-700"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Reach out to us directly through these channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <PhoneCall className="h-5 w-5 mt-0.5 mr-3 text-jaylink-600" />
                      <div>
                        <p className="font-medium">Phone Support</p>
                        <p className="text-sm text-gray-500">+234 800 JAYLINK</p>
                        <p className="text-sm text-gray-500">(Available 9am-5pm WAT, Mon-Fri)</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mt-0.5 mr-3 text-jaylink-600" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-gray-500">support@jaylinksms.com</p>
                        <p className="text-sm text-gray-500">(24/7 response within 24 hours)</p>
                      </div>
                    </div>
                    {/* <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 mt-0.5 mr-3 text-jaylink-600" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-gray-500">
                          Available in your dashboard during business hours
                        </p>
                      </div>
                    </div> */}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start">
                    <p className="text-sm font-medium mb-2">Response Times:</p>
                    <ul className="text-sm text-gray-500 space-y-1 list-disc pl-5">
                      <li>Phone: Immediate during business hours</li>
                      <li>Email: Within 24 hours</li>
                      {/* <li>Live Chat: Immediate during business hours</li> */}
                    </ul>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about JayLink's services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
              <CardFooter className="flex flex-col items-start border-t pt-6">
                <p className="mb-4">Couldn't find what you're looking for?</p>
                <Button
                  onClick={() => setActiveTab('contact')}
                  className="bg-jaylink-600 hover:bg-jaylink-700"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentation & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 mb-2 text-jaylink-600" />
                  <span className="font-medium">User Guide</span>
                  <span className="text-xs text-gray-500 mt-1">Complete usage instructions</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center"
                >
                  <AlertCircle className="h-8 w-8 mb-2 text-jaylink-600" />
                  <span className="font-medium">Troubleshooting</span>
                  <span className="text-xs text-gray-500 mt-1">Common issues & fixes</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center"
                >
                  <CheckCircle className="h-8 w-8 mb-2 text-jaylink-600" />
                  <span className="font-medium">Best Practices</span>
                  <span className="text-xs text-gray-500 mt-1">Optimization tips</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;