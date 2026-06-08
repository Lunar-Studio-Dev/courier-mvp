"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Star, Trash2 } from "lucide-react";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    width: number;
    height: number;
    isDefault: boolean | null;
  };
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function TemplateCard({ template, selected, onClick, onDelete }: TemplateCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${selected ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/30"}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{template.name}</span>
            {template.isDefault && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" /> Default
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {template.width} x {template.height} mm
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
