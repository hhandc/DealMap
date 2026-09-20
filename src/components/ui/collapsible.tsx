"use client";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
export function Disclosure({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Collapsible.Root className="disclosure">
      <Collapsible.Trigger className="disclosure-trigger">
        {title}
        <ChevronDown size={17} />
      </Collapsible.Trigger>
      <Collapsible.Content className="disclosure-content">
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
