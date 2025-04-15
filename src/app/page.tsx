"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { identifyMaterialPhases } from "@/ai/flows/identify-material-phases";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { Toaster, toast } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import * as htmlToImage from 'html-to-image';
import { Chart } from 'chart.js/auto';
import { downsample } from "@/lib/utils";

interface XRDDataPoint {
  angle: number;
  intensity: number;
}

interface IdentifiedPhase {
  name: string;
  crystalStructure: string;
  confidence: number;
  twoTheta: number;
}

export default function Home() {
  const [xrdData, setXrdData] = useState<XRDDataPoint[]>([]);
  const [peakData, setPeakData] = useState<number[]>([]);
  const [identifiedPhases, setIdentifiedPhases] = useState<IdentifiedPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [plotVisible, setPlotVisible] = useState(false);
  const chartInstance = useRef<Chart | null>(null);


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        let parsedData: XRDDataPoint[] = content
          .split("\n")
          .map((row) => {
            const [angle, intensity] = row.split(",").map(Number);
            return { angle: Number(angle), intensity: Number(intensity) };
          })
          .filter((point) => !isNaN(point.angle) && !isNaN(point.intensity));
        
        const sampledData = downsample(parsedData, 300);
        setXrdData(sampledData);
        setPeakData(sampledData.map((point) => point.intensity));
        setPlotVisible(true);
      };
      reader.readAsText(file);
    }
  };


  const assignFakeTwoTheta = (phases: { name: string; crystalStructure: string; confidence: number }[]) => {
    return phases.map((phase, index) => ({
      name: phase.name,
      crystalStructure: phase.crystalStructure,
      confidence: phase.confidence,
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

  const savePlotAsPng = async () => {
    if (chartRef.current) {
      try {
        const dataUrl = chartRef.current.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'xrd_plot.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Plot saved",
          description: "XRD plot saved as PNG.",
        });
      } catch (error) {
        console.error("Error saving plot:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save XRD plot. Try again.",
        });
      }
    } else {
      toast({
        title: "No plot to save",
        description: "Please upload XRD data first.",
      });
    }
  };

  useEffect(() => {
    if (chartRef.current && xrdData.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            datasets: [{
              label: 'Intensity',
              data: xrdData.map(item => ({ x: item.angle, y: item.intensity })),
              borderColor: 'hsl(var(--primary))',
              backgroundColor: 'rgba(0, 188, 212, 0.2)',
              tension: 0.4,
              pointRadius: 0,
            }]
          },
          options: {
            scales: {
              x: {
                type: 'linear',
                title: {
                  display: true,
                  text: '2θ (°)'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Intensity'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [xrdData]);


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

      {plotVisible && xrdData && xrdData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>XRD Plot</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={chartRef} />
            <Button onClick={savePlotAsPng} className="w-full mt-4">
              Save Plot as PNG
            </Button>
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
            <>
              <h3 className="text-lg font-semibold mb-2">
                Identified Phases:
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border">
                <div className="p-2">
                  {identifiedPhases.map((phase, index) => (
                    <div key={index} className="mb-2 p-2 rounded-md border">
                      <div className="flex flex-col md:flex-row gap-2">
                        <div>
                          Name: {phase.name}
                        </div>
                        <div>
                          Crystal Structure:
                          {phase.crystalStructure}
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2">
                        <div>
                          2θ: {phase.twoTheta.toFixed(2)}°
                        </div>
                        <div>
                          Confidence:
                          {(phase.confidence * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
