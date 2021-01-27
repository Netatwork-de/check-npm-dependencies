import { SemVer } from "semver";
import type { Package, PackageLock, PackageLockDependency } from "./common/package-types";
import type { Config } from "./config";
import { createPackageNameMatcher } from "./common/patterns";
import { parseVersion } from "./common/version";

export interface FixDuplicatesResult {
	readonly modified: boolean;
	readonly errors: FixDuplicatesError[];
}

export type FixDuplicatesError = {
	readonly type: "notRequired";
	readonly path: string[];
	readonly name: string;
} | {
	readonly type: "notInstalledInRoot";
	readonly path: string[];
	readonly name: string;
} | {
	readonly type: "requiredMajorMissmatchesRoot";
	readonly path: string[];
	readonly name: string;
	readonly requiredVersion: SemVer;
	readonly rootVersion: SemVer;
} | {
	readonly type: "requiredMinorExceedsRoot";
	readonly path: string[];
	readonly name: string;
	readonly requiredVersion: SemVer;
	readonly rootVersion: SemVer;
};

export function fixDuplicates(packageInfo: Package, packageLock: PackageLock, configs: Config[]): FixDuplicatesResult {
	if (!packageLock.dependencies) {
		throw new Error("packageLock contains no dependency information");
	}

	let modified = false;
	const errors: FixDuplicatesError[] = [];

	const matcher = createPackageNameMatcher(configs.map(c => c.patterns).flat(1));

	const versions = new Map<string, SemVer>();
	if (packageInfo.dependencies) {
		for (const name in packageInfo.dependencies) {
			if (matcher(name)) {
				versions.set(name, parseVersion(packageInfo.dependencies[name]));
			}
		}
	}
	if (packageInfo.devDependencies) {
		for (const name in packageInfo.devDependencies) {
			if (matcher(name)) {
				versions.set(name, parseVersion(packageInfo.devDependencies[name]));
			}
		}
	}

	const installedRootVersions = new Map<string, SemVer>();
	for (const name in packageLock.dependencies) {
		if (matcher(name)) {
			installedRootVersions.set(name, parseVersion(packageLock.dependencies[name].version));
		}
	}

	for (const name in packageLock.dependencies) {
		(function traverse(dependency: PackageLockDependency, path: string[]) {
			if (dependency.dependencies) {
				for (const name in dependency.dependencies) {
					let removed = false;
					if (matcher(name)) {
						const requiredVersionStr = dependency.requires?.[name];
						if (!requiredVersionStr) {
							errors.push({
								type: "notRequired",
								path,
								name
							});
						} else {
							const requiredVersion = parseVersion(requiredVersionStr);
							const rootVersion = installedRootVersions.get(name);
							if (rootVersion === undefined) {
								errors.push({
									type: "notInstalledInRoot",
									path,
									name
								});
							} else {
								if (requiredVersion.major !== rootVersion.major) {
									errors.push({
										type: "requiredMajorMissmatchesRoot",
										path,
										name,
										requiredVersion,
										rootVersion
									});
								} else if (requiredVersion.minor > rootVersion.minor) {
									errors.push({
										type: "requiredMinorExceedsRoot",
										path,
										name,
										requiredVersion,
										rootVersion
									});
								} else {
									delete dependency.dependencies[name];
									removed = true;
									modified = true;
								}
							}
						}
					}
					if (!removed) {
						traverse(dependency.dependencies[name], path.concat(name));
					}
				}
				if (Object.keys(dependency.dependencies).length === 0) {
					delete dependency.dependencies;
					modified = true;
				}
			}
		})(packageLock.dependencies[name], [name]);
	}

	return { modified, errors };
}
