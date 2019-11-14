#!/usr/bin/env node
import parseArgv = require("command-line-args");
import { resolve, join } from "path";
import { readJson } from "fs-extra";
import { Package, PackageLock } from "./package-types";
import { check } from "./check";
import colors = require("ansi-colors");

(async () => {
	const args = parseArgv([{ name: "context" }]);
	const context = resolve(args.context || ".");

	const packageInfo = await readJson(join(context, "package.json")) as Package;
	const packageLock = await readJson(join(context, "package-lock.json")) as PackageLock;

	const configs = getConfigs(packageInfo);
	if (configs.length === 0) {
		console.log(colors.red(`No configurations were found.`));
		process.exitCode = 1;
		return;
	}

	const errors = (await Promise.all(configs.map(c => check(packageInfo, packageLock, c)))).flat(1);
	if (errors.length > 0) {
		process.exitCode = 1;
		for (const error of errors) {
			switch (error.type) {
				case "duplicate":
					console.log(`${colors.red(`Multiple versions of ${colors.yellow(error.name)} are installed:`)}\n${
						Array.from(error.versions).map(([version, { paths }]) => {
							return `  ${colors.cyan(`v${version}`)} ${colors.gray("is installed in")} ${
								paths.map(formatPath).join(colors.gray(`\n${"".padStart(version.length + 16, " ")}and `))
							}`;
						}).join("\n")
					}\n`);
					break;

				case "missmatch":
					console.log(`${colors.red(`Different versions of ${colors.yellow(error.name)} are required:`)}\n${
						Array.from(error.versions).map(([version, { paths }]) => {
							return `  ${colors.cyan(`v${version}`)} ${colors.gray("is required by")} ${
								paths.map(formatPath).join(colors.gray(`\n${"".padStart(version.length + 15, " ")}and `))
							}`;
						}).join("\n")
					}\n`);
					break;
			}
		}

	} else {
		console.log(colors.green("No dependency problems were found."));
	}

})().catch(error => {
	console.error(error);
	process.exit(1);
});

function formatPath(path: string[]) {
	return path.length === 0
		? "<this package>"
		: path.map(colors.yellow).join(colors.gray(" => "));
}

function getConfigs(packageInfo: Package) {
	if (packageInfo.nawCheckNpmDependencies) {
		if (Array.isArray(packageInfo.nawCheckNpmDependencies)) {
			return packageInfo.nawCheckNpmDependencies;
		} else {
			return [packageInfo.nawCheckNpmDependencies];
		}
	} else {
		return [];
	}
}
