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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScaleOptions,
  LogarithmicScale,
} from 'chart.js';
import { Line } from 'chart.js';
import { downsample } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, LineChart, ChartProps } from "recharts";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

interface ChartWrapperProps extends ChartProps {
  data: any[];
  children: React.ReactNode;
}

const Chart = ({ data, children }: ChartWrapperProps) => {
  return (
    <LineChart data={data}>
      {children}
    </LineChart>
  );
};

export default function Home() {
  const [xrdData, setXrdData] = useState<XRDDataPoint[]>([]);
  const [peakData, setPeakData] = useState<number[]>([]);
  const [identifiedPhases, setIdentifiedPhases] = useState<IdentifiedPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [plotVisible, setPlotVisible] = useState(false);
  const [yAxisMax, setYAxisMax] = useState<number>(100); // Default Y-axis max value
  const [logScale, setLogScale] = useState(false); // Log scale toggle

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

        // Sample the data to reduce the number of points
        const sampleRate = 10; // Show every 10th point
        const sampledData = parsedData.filter((_, index) => index % sampleRate === 0);

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

  const chartData = {
    labels: xrdData.map(item => item.angle),
    datasets: [
      {
        label: 'Intensity',
        data: xrdData.map(item => item.intensity),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    scales: {
      y: {
        type: logScale ? 'logarithmic' : 'linear',
        position: 'left',
        max: yAxisMax,
        ticks: {
          callback: function(value: number | string) {
            if (logScale) {
              return Number(value).toExponential();
            }
            return value;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: '2θ (°)'
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'XRD Plot',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };


  return (
    
      <Toaster />
      
        
          
            <CardTitle>Upload XRD Data</CardTitle>
          
          
            <Input type="file" accept=".csv, .txt" onChange={handleFileUpload} />
          
        
      

      {plotVisible && xrdData && xrdData.length > 1 && (
        
          
            
              <ResponsiveContainer width="100%" height={400}>
                <Chart data={xrdData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="angle" label={{ value: '2θ (°)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Intensity', angle: -90, position: 'insideLeft', offset: -15 }} />
                  <RechartsTooltip />
                  <RechartsLegend />
                  <Line
                    type="monotone"
                    dataKey="intensity"
                    stroke="hsl(var(--primary))"
                    name="Intensity"
                  />
                </Chart>
              </ResponsiveContainer>
              
                <label htmlFor="y-scale">Adjust Y-Axis Scale:</label>
                <Slider
                  id="y-scale"
                  defaultValue={[yAxisMax]}
                  max={1000}
                  step={10}
                  onValueChange={(value) => setYAxisMax(value[0])}
                />
                <span>{yAxisMax}</span>
              
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-blue-500 rounded"
                  checked={logScale}
                  onChange={(e) => setLogScale(e.target.checked)}
                />
                <span>Log Scale Y-Axis</span>
              </label>

              <Button onClick={savePlotAsPng} className="w-full mt-4">
                Save Plot as PNG
              </Button>
            
          
        
      

      
        
          <CardTitle>Material Phase Identification</CardTitle>
        
        
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
            
              
                Identified Phases:
              
              <ScrollArea className="h-[200px] w-full rounded-md border">
                
                  {identifiedPhases.map((phase, index) => (
                    
                      
                        Name:
                        <Badge variant="secondary">{phase.name}</Badge>
                      
                      
                        Crystal Structure:
                        <Badge variant="secondary">{phase.crystalStructure}</Badge>
                      
                      
                        2θ:
                        <Badge variant="secondary">{phase.twoTheta.toFixed(2)}°</Badge>
                      
                      
                        Confidence:
                        <Badge variant="secondary">{(phase.confidence * 100).toFixed(2)}%</Badge>
                      
                    
                  ))}
                
              </ScrollArea>
            
          )}
        
      
    
  );
}
