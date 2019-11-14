import { PackageLock, Package, PackageLockDependencies } from "./package-types";
import createMatcher from"ignore";
import { VersionMap, Versions } from "./version-map";

export async function check(packageInfo: Package, packageLock: PackageLock,  config: CheckConfig) {
	const matcher = createMatcher({ ignorecase: true });
	if (config.patterns) {
		for (const pattern of config.patterns) {
			matcher.add(pattern);
		}
	} else {
		matcher.add("*");
	}

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
	})(packageLock.dependencies || {}, []);

	const errors: CheckError[] = [];
	if (!config.rules || config.rules["no-duplicates"]) {
		for (const [name, versions] of packages) {
			if (matcher.ignores(name) && VersionMap.hasMultiplePaths(versions)) {
				errors.push({ type: "duplicate", name, versions });
			}
		}
	}
	if (!config.rules || config.rules["no-missmatch"]) {
		for (const [name, versions] of requires) {
			if (matcher.ignores(name) && versions.size > 1) {
				errors.push({ type: "missmatch", name, versions });
			}
		}
	}
	return errors;
}

export interface CheckConfig {
	readonly dev?: boolean;
	readonly patterns?: string[];
	readonly rules?: {
		["no-duplicates"]?: boolean;
		["no-missmatch"]?: boolean;
	};
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
