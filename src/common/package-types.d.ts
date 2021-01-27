import { ConfigJson } from "../config";

export interface PackageLock {
	dependencies?: PackageLockDependencies;
}

export interface Package {
	dependencies?: PackageRequires;
	devDependencies?: PackageRequires;
	nawCheckNpmDependencies?: ConfigJson;
}

export interface PackageLockDependency {
	version: string;
	dev: boolean;
	requires?: PackageRequires;
	dependencies?: PackageLockDependencies;
}

export interface PackageLockDependencies {
	[name: string]: PackageLockDependency;
}

export interface PackageRequires {
	[name: string]: string;
}
