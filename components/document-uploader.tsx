"use client"

import React, { useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'

interface DocumentUploaderProps {
  setIsParsing: (isParsing: boolean) => void;
  onExtractedData: (updates: Record<string, string>) => void;
}

type ExtractionResponse = {
    filename: string;
    extracted_text: string;
};

type ErrorResponse = {
    detail: string;
};

const parseTextForSoilData = (text: string): Record<string, string> => {
    const soilData: Record<string, string> = {};
    const patterns: Record<string, RegExp> = {
        N: /(?:nitrogen|n)[\s(:)-]+([\d.]+)/i,
        P: /(?:phosphorus|p)[\s(:)-]+([\d.]+)/i,
        K: /(?:potassium|k)[\s(:)-]+([\d.]+)/i,
        ph: /(?:ph|soil ph)[\s(:)-]+([\d.]+)/i,
        moisture: /(?:moisture)[\s(:)-]+([\d.]+)/i,
    };

    for (const key in patterns) {
        const match = text.match(patterns[key]);
        if (match && match[1]) {
            soilData[key] = match[1];
        }
    }
    return soilData;
};

export function DocumentUploader({ setIsParsing, onExtractedData }: DocumentUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { toast } = useToast();

    const processFile = (selectedFile: File | undefined) => {
        if (!selectedFile) return;

        const allowedTypes = [ "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg" ];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Invalid file type. Please upload a PDF, DOCX, PNG, or JPEG.");
            setFile(null);
            return;
        }
        setError(null);
        setFile(selectedFile);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ✅ WORKAROUND: Using 'as any' to bypass the persistent type error.
        const selectedFile = (e.currentTarget as any).files?.[0];
        processFile(selectedFile);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        // ✅ WORKAROUND: Using 'as any' to bypass the persistent type error.
        const selectedFile = (e.dataTransfer as any).files?.[0];
        processFile(selectedFile);
    };

    const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleProcessDocument = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }
        setIsParsing(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            // NOTE: This uses an environment variable. Ensure your .env.local file is correct.
            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/extract-text-from-document`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
            });

            const result: unknown = await response.json();

            if (!response.ok) {
                const errorResult = result as ErrorResponse;
                throw new Error(errorResult.detail || "Failed to process the document.");
            }
            
            const successResult = result as ExtractionResponse;
            const extractedText = successResult.extracted_text;

            if (!extractedText || !extractedText.trim()) {
                throw new Error("Could not extract any readable text from the document.");
            }

            const parsedData = parseTextForSoilData(extractedText);

            if (Object.keys(parsedData).length === 0) {
                 toast({
                    title: "No Soil Data Found",
                    description: "We couldn't find soil nutrient values. Please enter them manually.",
                    variant: "default",
                });
            } else {
                onExtractedData(parsedData);
                toast({
                    title: "Data Extracted Successfully!",
                    description: `Found values for: ${Object.keys(parsedData).join(', ')}. The form has been updated.`,
                });
            }
        } catch (err: any) {
            const errorMessage = err.message || "An unknown error occurred.";
            setError(errorMessage);
            toast({
                title: "Processing Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="space-y-4">
            {!file ? (
                <Label
                    htmlFor="soil-report-input"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors ${isDragging ? "border-primary" : "border-input"}`}
                    onDragEnter={handleDragEvents}
                    onDragOver={handleDragEvents}
                    onDragLeave={handleDragEvents}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, PNG, or JPG</p>
                    </div>
                    <Input id="soil-report-input" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.png,.jpg,.jpeg" />
                </Label>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 text-sm border rounded-md bg-muted/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FileIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate font-medium">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setFile(null)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button 
                        onClick={handleProcessDocument}
                        className="w-full"
                    >
                        Process Document
                    </Button>
                </div>
            )}
            
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
    );
}