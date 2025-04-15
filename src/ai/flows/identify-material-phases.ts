'use server';
/**
 * @fileOverview An AI agent that identifies material phases from XRD peak data.
 *
 * - identifyMaterialPhases - A function that handles the material phase identification process.
 * - IdentifyMaterialPhasesInput - The input type for the identifyMaterialPhases function.
 * - IdentifyMaterialPhasesOutput - The return type for the identifyMaterialPhases function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getMaterialPhases, MaterialPhase} from '@/services/material-database';

const IdentifyMaterialPhasesInputSchema = z.object({
  peakData: z.array(z.number()).describe('Array of peak intensities from the XRD pattern.'),
});
export type IdentifyMaterialPhasesInput = z.infer<typeof IdentifyMaterialPhasesInputSchema>;

const IdentifyMaterialPhasesOutputSchema = z.object({
  identifiedPhases: z.array(z.object({
    name: z.string().describe('The name of the identified material phase.'),
    crystalStructure: z.string().describe('The crystal structure of the material phase.'),
    confidence: z.number().describe('A confidence score (0-1) for the identification.'),
  })).describe('List of identified material phases and their confidence scores.'),
});
export type IdentifyMaterialPhasesOutput = z.infer<typeof IdentifyMaterialPhasesOutputSchema>;

export async function identifyMaterialPhases(input: IdentifyMaterialPhasesInput): Promise<IdentifyMaterialPhasesOutput> {
  return identifyMaterialPhasesFlow(input);
}

const identifyMaterialPhasesPrompt = ai.definePrompt({
  name: 'identifyMaterialPhasesPrompt',
  input: {
    schema: z.object({
      peakData: z.array(z.number()).describe('Array of peak intensities from the XRD pattern.'),
      materialPhases: z.array(z.object({
        name: z.string().describe('The name of the material phase.'),
        crystalStructure: z.string().describe('The crystal structure of the material phase.'),
      })).describe('List of possible material phases.'),
    }),
  },
  output: {
    schema: z.object({
      identifiedPhases: z.array(z.object({
        name: z.string().describe('The name of the identified material phase.'),
        crystalStructure: z.string().describe('The crystal structure of the material phase.'),
        confidence: z.number().describe('A confidence score (0-1) for the identification.'),
      })).describe('List of identified material phases and their confidence scores.'),
    }),
  },
  prompt: `You are an expert material scientist specializing in X-ray diffraction (XRD) analysis.

You are provided with XRD peak data and a list of possible material phases.
Your task is to identify the material phases present in the sample based on the peak data.

Peak Data: {{{peakData}}}

Possible Material Phases:
{{#each materialPhases}}
- Name: {{{name}}}, Crystal Structure: {{{crystalStructure}}}
{{/each}}

Analyze the peak data and identify the material phases that are most likely present.
Provide a confidence score (0-1) for each identified phase.
`,
});

const identifyMaterialPhasesFlow = ai.defineFlow<
  typeof IdentifyMaterialPhasesInputSchema,
  typeof IdentifyMaterialPhasesOutputSchema
>({
  name: 'identifyMaterialPhasesFlow',
  inputSchema: IdentifyMaterialPhasesInputSchema,
  outputSchema: IdentifyMaterialPhasesOutputSchema,
}, async (input) => {
  const materialPhases = await getMaterialPhases(input.peakData);
  const {output} = await identifyMaterialPhasesPrompt({
    peakData: input.peakData,
    materialPhases,
  });
  return output!;
});
