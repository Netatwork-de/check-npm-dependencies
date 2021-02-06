import { ConfigJson } from "../config";

export type PackageLock = PackageLockV1 | PackageLockV2;

export interface PackageLockV1 {
	lockfileVersion: 1;
	dependencies?: PackageLockDependencies;
}

export interface PackageLockV2 {
	lockfileVersion: 2;
	packages: PackageLockPackages;
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

export interface PackageLockPackages {
	[path: string]: PackageLockPackage;
}

export interface PackageLockPackage {
}
