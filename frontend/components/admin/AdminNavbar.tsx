import { createElement, useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import router from "next/router";

import {
    ArrowRightEndOnRectangleIcon,
    Bars2Icon,
    ChevronDownIcon,
    Cog6ToothIcon,
    EyeIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import {
    Button,
    Collapse,
    IconButton,
    Menu,
    MenuHandler,
    MenuItem,
    MenuList,
    Navbar,
    Typography,
} from "@material-tailwind/react";

import { useFirebaseAuth } from "@/components/FirebaseAuthContext";

import DefaultAvatar from "@/assets/default-avatar.jpg";
import { signOut } from "firebase/auth";
import auth from "@/lib/firebase/auth";

// profile menu component
const profileMenuItems = [
    {
        label: "Enter Volunteer Page",
        icon: UserIcon,
        action: () => router.push("/volunteer/check-in"),
    },
    {
        label: "Sign Out",
        icon: ArrowRightEndOnRectangleIcon,
        action: () => signOut(auth).then(() => router.push("/login")),
    },
];

function ProfileMenu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useFirebaseAuth();

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <Menu
            open={isMenuOpen}
            handler={setIsMenuOpen}
            placement="bottom-end"
        >
            <MenuHandler>
                <Button
                    variant="text"
                    color="blue-gray"
                    className="flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 lg:ml-auto"
                >
                    <Image
                        src={user?.photoURL ?? DefaultAvatar}
                        width={32}
                        height={32}
                        alt="profile picture"
                        className="border border-gray-900 p-0.5 rounded-full object-cover object-center"
                        unoptimized
                        referrerPolicy="no-referrer"
                    />

                    <ChevronDownIcon
                        strokeWidth={2.5}
                        className={`h-3 w-3 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                    />
                </Button>
            </MenuHandler>
            <MenuList className="p-1">
                {profileMenuItems.map(({ label, icon, action }, key) => {
                    const isLastItem = key === profileMenuItems.length - 1;
                    return (
                        <MenuItem
                            key={label}
                            onClick={() => {
                                action();
                                closeMenu();
                            }}
                            className={`flex items-center gap-2 rounded ${
                                isLastItem ? "hover:bg-red-500/10 focus:bg-red-500/10 active:bg-red-500/10" : ""
                            }`}
                        >
                            {createElement(icon, {
                                className: `h-4 w-4 ${isLastItem ? "text-red-500" : ""}`,
                                strokeWidth: 2,
                            })}
                            <Typography
                                as="span"
                                variant="small"
                                className="font-normal"
                                color={isLastItem ? "red" : "inherit"}
                            >
                                {label}
                            </Typography>
                        </MenuItem>
                    );
                })}
            </MenuList>
        </Menu>
    );
}

const navListItems = [
    {
        label: "Overview",
        icon: EyeIcon,
        link: "/admin"
    },
    {
        label: "Settings",
        icon: Cog6ToothIcon,
        link: "/admin/settings"
    },
    
];

function NavList() {
    return (
        <ul className="my-2 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center">
            {navListItems.map(({ label, icon, link }, key) => (
                <Link
                    key={key}
                    href={link}
                >
                    <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal"
                    >
                        <MenuItem className="flex items-center gap-2 lg:rounded-full">
                            {createElement(icon, {
                                className: "h-[18px] w-[18px]",
                            })}{" "}
                            {label}
                        </MenuItem>
                    </Typography>
                </Link>
            ))}
        </ul>
    );
}

export default function AdminNavbar() {
    const [isNavOpen, setIsNavOpen] = useState(false);

    const toggleIsNavOpen = () => setIsNavOpen((cur) => !cur);

    useEffect(() => {
        window.addEventListener("resize", () => window.innerWidth >= 1024 && setIsNavOpen(false));
    }, []);

    return (
        <Navbar className="lg:mx-4 lg:mt-4 p-2 rounded-none lg:rounded-full lg:pl-6 w-auto transition-all duration-150 max-w-none">
            <div className="relative mx-auto flex items-center text-blue-gray-900">
                <Link href="/admin">
                    <Typography className="mr-4 ml-2 cursor-pointer font-medium text-xl">
                        FraserVotes (Admin)
                    </Typography>
                </Link>
                <div className="absolute top-2/4 left-2/4 hidden -translate-x-2/4 -translate-y-2/4 lg:block">
                    <NavList />
                </div>
                <IconButton
                    size="sm"
                    color="blue-gray"
                    variant="text"
                    onClick={toggleIsNavOpen}
                    className="ml-auto mr-2 lg:hidden"
                >
                    <Bars2Icon className="h-6 w-6" />
                </IconButton>
                <ProfileMenu />
            </div>
            <Collapse
                open={isNavOpen}
                className="h-full"
            >
                <NavList />
            </Collapse>
        </Navbar>
    );
}