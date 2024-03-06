#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import parseArgs from "yargs-parser";
import createMatcher from "ignore";
import color from "ansi-colors";
import { PackageJson, PackageLockJsonV3 } from "./types.js";

const args = parseArgs(process.argv.slice(2), {
	string: ["context",],
	alias: {
		"c": "context",
	},
});

const context = resolve(args.context ?? ".");

const packageFilename = join(context, "package.json");
const packageInfo: PackageJson = JSON.parse(await readFile(packageFilename, "utf-8"));
const config = packageInfo.nawCheckNpmDependencies;
if (!config) {
	throw new Error("\"nawCheckNpmDependencies\" field is missing package.json");
}

const packageLockFilename = join(context, "package-lock.json");
const packageLock: PackageLockJsonV3 = JSON.parse(await readFile(packageLockFilename, "utf8"));
if (packageLock.lockfileVersion !== 3) {
	throw new Error(`Unsupported lockfile version: ${packageLock.lockfileVersion}`);
}

const groupsByName = new Map<string, {
	path: string;
	version: string;
}[]>();

function getPackageName(path: string): string {
	const pathParts = path.split("/").filter(p => p !== "" && p !== "." && p !== "..");
	const moduleBase = pathParts.lastIndexOf("node_modules");
	return pathParts.slice(moduleBase + 1).join("/");
}

function formatPath(path: string): string {
	let output = path;
	const name = getPackageName(path);
	if (name) {
		const index = output.lastIndexOf(name);
		return color.dim(output.slice(0, index)) + color.bold(name) + color.dim(output.slice(index + name.length));
	} else {
		return color.dim(output);
	}
}

for (const path in packageLock.packages) {
	const name = getPackageName(path);
	if (!name) {
		continue;
	}

	let group = groupsByName.get(name);
	if (group === undefined) {
		groupsByName.set(name, group = []);
	}

	group.push({
		path,
		version: packageLock.packages[path].version,
	});
}

if (config.noDuplicates) {
	const matcher = createMatcher({ ignoreCase: false });
	matcher.add(config.noDuplicates);
	for (const [name, group] of groupsByName) {
		if (matcher.ignores(name)) {
			if (group.length > 1) {
				process.exitCode = 1;
				console.log(`Duplicate installation of ${color.green.bold(name)}:`);
				for (const entry of group) {
					console.log(`  ${color.cyan(entry.version)} is installed at ${formatPath(entry.path)}`);
				}
				console.log();
			}
		}
	}
}

if (config.sameVersions) {
	for (const pattern of config.sameVersions) {
		const matcher = createMatcher({ ignoreCase: false });
		matcher.add(Array.isArray(pattern) ? pattern : [pattern]);
		const pathsByVersion = new Map<string, string[]>();
		for (const [name, group] of groupsByName) {
			if (matcher.ignores(name)) {
				for (const entry of group) {
					const paths = pathsByVersion.get(entry.version);
					if (paths) {
						paths.push(entry.path);
					} else {
						pathsByVersion.set(entry.version, [entry.path]);
					}
				}
			}
		}
		if (pathsByVersion.size > 1) {
			process.exitCode = 1;
			console.log(`Multiple versions of packages matching ${Array.isArray(pattern) ? pattern.map(p => color.green.bold(p)).join(", ") : color.green.bold(pattern)} are installed:`);
			for (const [version, paths] of pathsByVersion) {
				console.log(`  ${color.cyan(version)} is installed at:`);
				for (const path of paths) {
					console.log(`    ${formatPath(path)}`);
				}
			}
			console.log();
		}
	}
}
