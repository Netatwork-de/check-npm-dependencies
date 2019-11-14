import { CheckConfig } from "./check";

export interface PackageLock {
	readonly dependencies?: PackageLockDependencies;
}

export interface Package {
	readonly dependencies?: PackageRequires;
	readonly devDependencies?: PackageRequires;
	readonly nawCheckNpmDependencies?: CheckConfig | CheckConfig[];
}

export interface PackageLockDependency {
	readonly version: string;
	readonly dev: boolean;
	readonly requires?: PackageRequires;
	readonly dependencies?: PackageLockDependencies;
}

export interface PackageLockDependencies {
	readonly [name: string]: PackageLockDependency;
}

export interface PackageRequires {
	readonly [name: string]: string;
}
