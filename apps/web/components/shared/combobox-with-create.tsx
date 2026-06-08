"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export interface ComboboxItem {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxWithCreateProps {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  onAddNew?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  addNewLabel?: string;
  disabled?: boolean;
}

export function ComboboxWithCreate({
  items,
  value,
  onChange,
  onSearch,
  onAddNew,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  addNewLabel = "Add New",
  disabled,
}: ComboboxWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = items.find((i) => i.value === value);

  // Client-side filter when no server-side search is provided
  const filteredItems =
    !onSearch && query
      ? items.filter(
          (i) =>
            i.label.toLowerCase().includes(query.toLowerCase()) ||
            i.sublabel?.toLowerCase().includes(query.toLowerCase()),
        )
      : items;

  function handleSearch(val: string) {
    setQuery(val);
    onSearch?.(val);
  }

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            {selected ? (
              <span className="truncate">
                {selected.label}
                {selected.sublabel && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({selected.sublabel})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="border-0 focus-visible:ring-0 px-0"
              />
            </div>
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => {
                      onChange(item.value);
                      setOpen(false);
                      setQuery("");
                      onSearch?.("");
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === item.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="truncate">{item.label}</div>
                      {item.sublabel && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {onAddNew && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setQuery("");
                      onAddNew();
                    }}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {addNewLabel}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
