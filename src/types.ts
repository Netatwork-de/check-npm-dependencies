
export interface Config {
	noDuplicates?: string[];
	sameVersions?: (string | string[])[];
}

export interface PackageJson {
	nawCheckNpmDependencies?: Config;
}

export interface PackageLockJsonV3 {
	lockfileVersion: 3;
	packages: {
		[path: string]: {
			version: string;
		};
	};
}
