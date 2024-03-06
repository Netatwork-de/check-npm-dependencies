import { ConfigJson } from "./config.js";

export interface PackageJson {
	nawCheckNpmDependencies?: ConfigJson | string;
}

export interface PackageLockJsonV3 {
	lockfileVersion: 3;
	packages: {
		[path: string]: {
			version: string;
		};
	};
}
