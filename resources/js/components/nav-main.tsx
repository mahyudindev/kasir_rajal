import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import React from 'react';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [open, setOpen] = useState<string | null>(null);
    const { state } = useSidebar();

    const handleToggle = (title: string) => {
        setOpen(open === title ? null : title);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <React.Fragment key={item.title}>
                        {item.children ? (
                            <SidebarMenuItem key={item.title}>
                                {state === 'collapsed' ? (
                                    <SidebarMenuButton
                                        tooltip={{ children: item.title }}
                                        asChild
                                    >
                                        <span className="flex items-center justify-center w-full">
                                            {item.icon && <item.icon />}
                                        </span>
                                    </SidebarMenuButton>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                                            onClick={() => handleToggle(item.title)}
                                        >
                                            {item.icon && <item.icon />}
                                            <span className="flex-1">{item.title}</span>
                                            {open === item.title ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                        {open === item.title && (
                                            <SidebarMenuSub>
                                                {item.children.map((child) => (
                                                    <SidebarMenuSubItem key={child.title}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={child.href === page.url}
                                                        >
                                                            <Link href={child.href!} prefetch className="flex items-center gap-2">
                                                                {child.icon && <child.icon />}
                                                                <span>{child.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        )}
                                    </>
                                )}
                            </SidebarMenuItem>
                        ) : (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={item.href === page.url} tooltip={{ children: item.title }}>
                                    <Link href={item.href!} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </React.Fragment>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
