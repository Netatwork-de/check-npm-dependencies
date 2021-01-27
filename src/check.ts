import type { Config } from "./config";
import type { PackageLock, Package, PackageLockDependencies } from "./common/package-types";
import { createPackageNameMatcher } from "./common/patterns";
import { VersionMap, Versions } from "./common/version-map";

export function check(packageInfo: Package, packageLock: PackageLock, config: Config) {
	if (!packageLock.dependencies) {
		throw new Error("packageLock contains no dependency information");
	}

	const matcher = createPackageNameMatcher(config.patterns);
	const packages = new VersionMap();
	const requires = new VersionMap();

	if (packageInfo.dependencies) {
		for (const name in packageInfo.dependencies) {
			requires.add(name, packageInfo.dependencies[name], []);
		}
	}
	if (config.dev && packageInfo.devDependencies) {
		for (const name in packageInfo.devDependencies) {
			requires.add(name, packageInfo.devDependencies[name], []);
		}
	}

	(function traverse(dependencies: PackageLockDependencies, path: string[]) {
		for (const name in dependencies) {
			const dependency = dependencies[name];
			if (config.dev || !dependency.dev) {
				packages.add(name, dependency.version, path);
				if (dependency.requires) {
					for (const requiredName in dependency.requires) {
						requires.add(requiredName, dependency.requires[requiredName], path.concat(name));
					}
				}
				if (dependency.dependencies) {
					traverse(dependency.dependencies, path.concat(name));
				}
			}
		}
	})(packageLock.dependencies, []);

	const errors: CheckError[] = [];
	if (!config.rules || config.rules.noDuplicates) {
		for (const [name, versions] of packages) {
			if (matcher(name) && VersionMap.hasMultiplePaths(versions)) {
				errors.push({ type: "duplicate", name, versions });
			}
		}
	}
	if (!config.rules || config.rules.noMissmatch) {
		for (const [name, versions] of requires) {
			if (matcher(name) && versions.size > 1) {
				errors.push({ type: "missmatch", name, versions });
			}
		}
	}
	return errors;
}

export type CheckError = {
	readonly type: "duplicate";
	readonly name: string;
	readonly versions: Versions;
} | {
	readonly type: "missmatch";
	readonly name: string;
	readonly versions: Versions;
};
