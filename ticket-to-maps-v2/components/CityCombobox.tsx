'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getVillages } from '@/lib/streets';

const villages = getVillages();

export interface CityComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function CityCombobox({
  value,
  onChange,
  placeholder = 'Sélectionnez une ville',
  className,
  label = 'Ville'
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (selected: string) => {
      onChange(selected === value ? '' : selected);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(15);
      }
      setOpen(false);
    },
    [onChange, value]
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-12 w-full justify-between rounded-xl px-4 text-base"
          >
            <span className="truncate text-left font-semibold">
              {value ? value : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-5 w-5 opacity-60" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder="Chercher une ville..." />
            <CommandEmpty>Pas de résultat</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {villages.map((city) => (
                  <CommandItem key={city} value={city} onSelect={handleSelect}>
                    <Check
                      className={cn('mr-2 h-5 w-5', value === city ? 'opacity-100' : 'opacity-0')}
                    />
                    <span className="text-base">{city}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
