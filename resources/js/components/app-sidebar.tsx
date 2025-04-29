import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

import { Users, FileText, Database, BarChart2, Calendar, CalendarRange, CalendarCheck2 } from 'lucide-react';

const allNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Transaksi',
        href: '/transaksi',
        icon: FileText,
    },
    {
        title: 'Pengguna',
        href: '/pengguna',
        icon: Users,
    },
    {
        title: 'Data Layanan',
        href: '/layanan',
        icon: Database,
    },
    {
        title: 'Laporan',
        icon: BarChart2,
        children: [
            {
                title: 'Harian',
                href: '/laporan/harian',
                icon: Calendar,
            },
            {
                title: 'Mingguan',
                href: '/laporan/mingguan',
                icon: CalendarRange,
            },
            {
                title: 'Bulanan',
                href: '/laporan/bulanan',
                icon: CalendarCheck2,
            },
        ],
    },
];

const reportNavItem: NavItem = {
    title: 'Laporan',
    icon: BarChart2,
    children: [
        {
            title: 'Harian',
            href: '/laporan/harian',
            icon: Calendar,
        },
        {
            title: 'Mingguan',
            href: '/laporan/mingguan',
            icon: CalendarRange,
        },
        {
            title: 'Bulanan',
            href: '/laporan/bulanan',
            icon: CalendarCheck2,
        },
    ],
};



export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user.role as string;
    
    // Determine which nav items to show based on user role
    const navItemsToShow = userRole === 'bendahara' ? [reportNavItem] : allNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItemsToShow} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
