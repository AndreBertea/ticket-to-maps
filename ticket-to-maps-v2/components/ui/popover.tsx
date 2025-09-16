'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverPrimitiveContent = PopoverPrimitive.Content;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitiveContent>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitiveContent>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitiveContent
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 w-[min(360px,90vw)] rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg outline-none',
      'transition duration-150 data-[state=open]:scale-100 data-[state=open]:opacity-100 data-[state=closed]:scale-95 data-[state=closed]:opacity-0',
      className
    )}
    {...props}
  />
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
