
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ServiceCost {
  id: string;
  name: string;
  cost: number;
  description: string;
}

const AdminServiceCosts = () => {
  // Mock service costs data
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([
    {
      id: "sms",
      name: "SMS Message",
      cost: 0.02,
      description: "Cost per SMS message sent through the platform"
    },
    {
      id: "audio_message",
      name: "Audio Message",
      cost: 0.05,
      description: "Cost per audio message sent through the platform"
    },
    {
      id: "tts",
      name: "Text-to-Speech Conversion",
      cost: 0.03,
      description: "Cost per text-to-speech conversion"
    },
    {
      id: "audio_upload",
      name: "Audio Upload Storage",
      cost: 0.10,
      description: "Cost per audio file uploaded and stored"
    }
  ]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [editedCosts, setEditedCosts] = useState<Record<string, number>>({});

  const handleCostChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedCosts(prev => ({
        ...prev,
        [id]: numValue
      }));
    }
  };

  const handleSaveChanges = () => {
    setIsUpdating(true);
    
    // Simulate API call to update service costs
    setTimeout(() => {
      const updatedCosts = serviceCosts.map(service => ({
        ...service,
        cost: editedCosts[service.id] !== undefined ? editedCosts[service.id] : service.cost
      }));
      
      setServiceCosts(updatedCosts);
      setEditedCosts({});
      
      toast({
        title: "Success",
        description: "Service costs have been updated successfully.",
      });
      
      setIsUpdating(false);
    }, 1000);
  };

  const getCostValue = (id: string, originalCost: number): number => {
    return editedCosts[id] !== undefined ? editedCosts[id] : originalCost;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Service Costs</h2>
        <p className="text-muted-foreground">
          Manage the pricing for various services on the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Service Pricing</CardTitle>
          <CardDescription>
            Set the cost per unit for each service type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {serviceCosts.map((service) => (
            <div key={service.id} className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-9"
                    value={getCostValue(service.id, service.cost)}
                    onChange={(e) => handleCostChange(service.id, e.target.value)}
                  />
                </div>
                <span className="text-sm text-muted-foreground">per unit</span>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSaveChanges} 
            disabled={isUpdating || Object.keys(editedCosts).length === 0}
          >
            {isUpdating ? "Saving Changes..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Strategy</CardTitle>
          <CardDescription>Information about pricing strategy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Consider the following when setting service prices:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Competitor pricing in the market</li>
            <li>Your operational costs for providing each service</li>
            <li>User price sensitivity and willingness to pay</li>
            <li>Volume discounts for high-usage customers</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminServiceCosts;
