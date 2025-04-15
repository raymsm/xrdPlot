"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "@/components/ui/chart";
import { identifyMaterialPhases } from "@/ai/flows/identify-material-phases";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface XRDDataPoint {
  angle: number;
  intensity: number;
}

interface IdentifiedPhase {
  name: string;
  crystalStructure: string;
  confidence: number;
  twoTheta?: number;
}

export default function Home() {
  const [xrdData, setXrdData] = useState<XRDDataPoint[]>([]);
  const [peakData, setPeakData] = useState<number[]>([]);
  const [identifiedPhases, setIdentifiedPhases] = useState<IdentifiedPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsedData: XRDDataPoint[] = content
          .split("\n")
          .map((row) => {
            const [angle, intensity] = row.split(",").map(Number);
            return { angle: Number(angle), intensity: Number(intensity) };
          })
          .filter((point) => !isNaN(point.angle) && !isNaN(point.intensity));
        setXrdData(parsedData);
        setPeakData(parsedData.map((point) => point.intensity));
      };
      reader.readAsText(file);
    }
  };

  const assignFakeTwoTheta = (phases: { name: string; crystalStructure: string; confidence: number }[]) => {
    return phases.map((phase, index) => ({
      ...phase,
      twoTheta: 20 + index * 5, // Generate fake 2theta values
    }));
  };

  const handleIdentifyPhases = async () => {
    if (!peakData.length) {
      toast({
        title: "No data to analyze",
        description: "Please upload XRD data first.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await identifyMaterialPhases({ peakData });
      // Assign fake 2theta values to the identified phases
      const phasesWithTwoTheta = assignFakeTwoTheta(result.identifiedPhases);
      setIdentifiedPhases(phasesWithTwoTheta);
      toast({
        title: "Material phases identified",
        description: "Analysis complete.",
      });
    } catch (error: any) {
      console.error("Error identifying phases:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error?.message || "Failed to identify material phases. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col gap-4">
      <Toaster />
      <Card>
        <CardHeader>
          <CardTitle>Upload XRD Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Input type="file" accept=".csv, .txt" onChange={handleFileUpload} />
        </CardContent>
      </Card>

      {xrdData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>XRD Plot</CardTitle>
          </CardHeader>
          <CardContent>
              <Chart width={600} height={400} data={xrdData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="angle" label={{ value: '2θ (°)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Intensity', angle: -90, position: 'insideLeft', offset: -15 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="hsl(var(--primary))"
                  name="Intensity"
                />
              </Chart>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Material Phase Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleIdentifyPhases}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Identifying...
              </>
            ) : (
              "Identify Material Phases"
            )}
          </Button>

          {identifiedPhases.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">
                Identified Phases:
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border">
                <div className="p-2">
                  {identifiedPhases.map((phase, index) => (
                    <div
                      key={index}
                      className="mb-2 p-2 rounded-md border shadow-sm"
                    >
                      <p>
                        <Badge variant="secondary">Name:</Badge> {phase.name}
                      </p>
                      <p>
                        <Badge variant="secondary">Crystal Structure:</Badge>{" "}
                        {phase.crystalStructure}
                      </p>
                       {phase.twoTheta && (
                          <p>
                            <Badge variant="secondary">2θ:</Badge> {phase.twoTheta.toFixed(2)}°
                          </p>
                        )}
                      <p>
                        <Badge variant="secondary">Confidence:</Badge>{" "}
                        {(phase.confidence * 100).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
