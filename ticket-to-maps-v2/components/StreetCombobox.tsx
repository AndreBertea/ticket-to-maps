'use client';

import * as React from 'react';
import { ChevronsUpDown, Hash, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { suggestStreets } from '@/lib/streets';

export interface StreetComboboxProps {
  city?: string;
  street?: string;
  number?: string;
  onStreetChange: (street: string) => void;
  onNumberChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function StreetCombobox({
  city,
  street,
  number,
  onStreetChange,
  onNumberChange,
  placeholder = 'Rechercher une rue',
  className
}: StreetComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const disabled = !city;

  React.useEffect(() => {
    if (open) {
      setSearch(street ?? '');
    }
  }, [open, street]);

  const suggestions = React.useMemo(() => {
    if (!city) return [];
    return suggestStreets(city, search);
  }, [city, search]);

  const handleSelect = React.useCallback(
    (value: string) => {
      onStreetChange(value);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(10);
      }
      setOpen(false);
    },
    [onStreetChange]
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-muted-foreground">Rue et numéro</label>
      <div className="flex items-center gap-2">
        <div className="w-24">
          <Input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            placeholder="N°"
            value={number ?? ''}
            onChange={(event) => onNumberChange(event.target.value)}
            className="h-12 rounded-xl text-center text-base"
            disabled={disabled}
            aria-label="Numéro de voie"
          />
        </div>
        <Popover open={open && !disabled} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="h-12 flex-1 justify-between rounded-xl px-4 text-base"
            >
              <span className="flex min-w-0 items-center gap-2">
                <MapPin className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
                <span className="truncate font-semibold">
                  {street ? street : disabled ? 'Choisissez une ville' : placeholder}
                </span>
              </span>
              <ChevronsUpDown className="ml-2 h-5 w-5 opacity-60" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                value={search}
                onValueChange={setSearch}
                placeholder="Tapez quelques lettres..."
              />
              <CommandList>
                <CommandEmpty>Aucune rue trouvée</CommandEmpty>
                <CommandGroup heading={city ?? ''}>
                  {suggestions.map((item) => (
                    <CommandItem key={item} value={item} onSelect={handleSelect}>
                      <Hash className="h-4 w-4 opacity-60" aria-hidden />
                      <span className="text-base">{item}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
