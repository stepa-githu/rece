"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/ui";
import type { AppContext } from "@/types";

const mainNav: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Panoramica", icon: "home" },
  { href: "/reviews", label: "Recensioni", icon: "reviews" },
  { href: "/knowledge", label: "Conoscenza AI", icon: "book" },
  { href: "/tone", label: "Tono di voce", icon: "sparkles" },
  { href: "/integrations", label: "Collegamenti", icon: "plug" },
  { href: "/settings", label: "Struttura", icon: "settings" },
];

function NavItem({ href, label, icon, onClick }: { href: string; label: string; icon: IconName; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return <Link className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-[#fff0eb] text-[#cc5742]" : "text-[#5f6a65] hover:bg-[#f2f2ed] hover:text-[#17211d]"}`} href={href} onClick={onClick}><Icon name={icon} size={18} />{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ec765f]" />}</Link>;
}

function SidebarContent({ context, close }: { context: AppContext; close?: () => void }) {
  return <>
    <div className="px-3 pt-2"><Logo /></div>
    <div className="mt-6 rounded-2xl border border-[#e7e7df] bg-white p-3.5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf5f0] font-black text-[#2f7a64]">{(context.hotel?.name ?? "R").slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#17211d]">{context.hotel?.name ?? "Amministrazione Rece"}</p><p className="truncate text-xs text-[#89928d]">{context.user.email}</p></div></div></div>
    <nav className="mt-5 space-y-1" aria-label="Navigazione principale">{mainNav.map((item) => <NavItem key={item.href} {...item} onClick={close} />)}</nav>
    {context.profile.role === "admin" && <div className="mt-6 border-t border-[#e7e7df] pt-5"><p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#a0a7a3]">Backoffice</p><NavItem href="/admin" label="Hotel e utenti" icon="users" onClick={close} /></div>}
    <div className="mt-auto pt-6"><a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#7b8580] hover:bg-[#f2f2ed]" href="/auth/signout"><Icon name="logout" size={18} /> Esci</a></div>
  </>;
}

export function AppShell({ context, children }: { context: AppContext; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-[#e5e5de] bg-[#fbfaf6]/95 p-4 backdrop-blur lg:flex"><SidebarContent context={context} /></aside>
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e7e7df] bg-[#fbfaf6]/92 px-4 backdrop-blur lg:hidden"><Logo compact /><button className="grid h-10 w-10 place-items-center rounded-xl border border-[#e0e1da] bg-white" onClick={() => setOpen(true)} aria-label="Apri menu"><Icon name="menu" /></button></header>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-[#17211d]/35 backdrop-blur-[2px]" aria-label="Chiudi menu" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-[#fbfaf6] p-4 shadow-2xl"><button className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl" onClick={() => setOpen(false)} aria-label="Chiudi menu"><Icon name="close" /></button><SidebarContent context={context} close={() => setOpen(false)} /></aside></div>}
    <main className="lg:pl-[264px]"><div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-9">{children}</div></main>
  </div>;
}
