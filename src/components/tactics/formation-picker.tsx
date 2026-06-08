"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMATION_LIST } from "@/types";

interface FormationPickerProps {
  value: string;
  onChange: (formation: string) => void;
}

export function FormationPicker({ value, onChange }: FormationPickerProps) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder="选择阵型" />
      </SelectTrigger>
      <SelectContent>
        {FORMATION_LIST.map((f) => (
          <SelectItem key={f} value={f}>
            {f}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
