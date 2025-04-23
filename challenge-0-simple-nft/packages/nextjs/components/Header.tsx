"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BugAntIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "My NFTs",
    href: "/myNFTs",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
 
  {
    label: "Transfers",
    href: "/transfers",
    icon: <ArrowPathIcon className="h-4 w-4" />,
  },
  {
    label: "IPFS Upload",
    href: "/ipfsUpload",
    icon: <ArrowUpTrayIcon className="h-4 w-4" />,
  },
  {
    label: "IPFS Download",
    href: "/ipfsDownload",
    icon: <ArrowDownTrayIcon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
  {
    label: "NFTBuyCard",
    href: "/market",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "bidding",
    href: "/AuctionMarket",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "Rental",
    href: "/Rental",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "Box",
    href: "/box",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "Blind",
    href: "/Blind",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky xl:static top-0 navbar min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2 bg-gradient-to-r from-purple-900/90 via-blue-900/90 to-purple-900/90 backdrop-blur-md border-b border-white/10">
    <div className="navbar-start w-auto xl:w-1/2">
      <div className="dropdown" ref={burgerMenuRef}>
        <label
          tabIndex={0}
          className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-white/10" : "hover:bg-transparent"}`}
          onClick={() => {
            setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
          }}
        >
          <Bars3Icon className="h-6 w-6 text-white" />
        </label>
        {isDrawerOpen && (
          <ul
            tabIndex={0}
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-lg bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-md rounded-box w-52 border border-white/10"
            onClick={() => {
              setIsDrawerOpen(false);
            }}
          >
            <HeaderMenuLinks />
          </ul>
        )}
      </div>

        {/* LOGO和标题 */}
        <Link href="/" passHref className="hidden xl:flex items-center gap-2 ml-4 mr-6 shrink-0">
        <div className="flex relative w-10 h-10">
          <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold leading-tight text-white">SRE Challenges</span>
          <span className="text-xs text-white/70">#0: Simple NFT</span>
        </div>
      </Link>
        {/* 只有一个下拉菜单按钮 */}
        <div className="xl:hidden">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="ml-1 btn btn-ghost"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

      </div>

      {/* 右侧按钮 */}
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
