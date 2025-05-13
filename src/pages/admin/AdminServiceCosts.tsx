
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface ServiceCost {
  id: string;
  name: string;
  description: string;
  cost: number;
  unit: string;
}

const AdminServiceCosts = () => {
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([
    {
      id: "1",
      name: "SMS Message",
      description: "Cost per SMS message sent through the platform",
      cost: 0.05,
      unit: "per message"
    },
    {
      id: "2",
      name: "Voice Call",
      description: "Cost per minute for voice calls",
      cost: 0.10,
      unit: "per minute"
    },
    {
      id: "3",
      name: "Text-to-Speech",
      description: "Cost for converting text to speech",
      cost: 0.08,
      unit: "per request"
    },
    {
      id: "4",
      name: "Audio Storage",
      description: "Cost for storing audio files",
      cost: 0.01,
      unit: "per MB per month"
    },
    {
      id: "5",
      name: "Audio Upload",
      description: "Cost for processing uploaded audio files",
      cost: 0.03,
      unit: "per file"
    }
  ]);

  const handleCostChange = (id: string, newCost: number) => {
    setServiceCosts(prev => 
      prev.map(cost => 
        cost.id === id ? { ...cost, cost: newCost } : cost
      )
    );
  };

  const handleSave = (id: string) => {
    // In a real app, we would make an API call to update the cost
    toast({
      title: "Cost Updated",
      description: "The service cost has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Service Costs</h2>
        <p className="text-muted-foreground">
          Manage the costs for various services offered on the platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {serviceCosts.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle>{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor={`cost-${service.id}`} className="text-right">
                    Cost ($)
                  </Label>
                  <div className="col-span-2 relative">
                    <Input
                      id={`cost-${service.id}`}
                      value={service.cost}
                      onChange={(e) => handleCostChange(service.id, Number(e.target.value) || 0)}
                      type="number"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-right">Unit</Label>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{service.unit}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => handleSave(service.id)}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminServiceCosts;
