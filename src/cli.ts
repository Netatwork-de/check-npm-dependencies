#!/usr/bin/env node
import { resolve, join } from "path";
import colors from "ansi-colors";
import parseArgv from "command-line-args";
import { readFile, writeFile } from "fs/promises";
import { check } from "./check";
import { getConfigs } from "./config";
import type { Package, PackageLock } from "./common/package-types";
import { fixDuplicates } from "./fix-duplicates";
import { SemVer } from "semver";
import { exec } from "./common/exec";

const ARG_CONTEXT = "context";
const ARG_FIX_DUPLICATES = "fix-duplicates";

interface JsonFormat {
	readonly indent: string;
	readonly trailer: string;
}

async function readPackageFiles(context: string) {
	const packageInfo = await readFile(join(context, "package.json"), "utf-8");
	const indentMatch = /(?:^|\n)(\s+)/.exec(packageInfo);
	const finalNewline = /\n$/.test(packageInfo);
	return <[Package, PackageLock, JsonFormat]> [
		JSON.parse(packageInfo) as Package,
		await readFile(join(context, "package-lock.json"), "utf-8").then(JSON.parse) as PackageLock,
		{ indent: indentMatch ? indentMatch[1] : "\t", trailer: finalNewline ? "\n" : "" }
	];
}

(async () => {
	const args = parseArgv([
		{ name: ARG_CONTEXT },
		{ name: ARG_FIX_DUPLICATES, type: Boolean }
	]);

	const context = resolve(args.ARG_CONTEXT || ".");

	let [packageInfo, packageLock, jsonFormat] = await readPackageFiles(context);

	const configs = await getConfigs(packageInfo, context);
	if (configs.length === 0) {
		console.log(colors.red(`No configurations were found.`));
		process.exitCode = 1;
		return;
	}

	if (args[ARG_FIX_DUPLICATES]) {
		const { modified, errors } = fixDuplicates(packageInfo, packageLock, configs);
		if (modified) {
			await writeFile(join(context, "package-lock.json"), JSON.stringify(packageLock, null, jsonFormat.indent) + jsonFormat.trailer);
			if (errors.length === 0) {
				await exec(context, "npm", "ci");
			}
		}
		if (errors.length > 0) {
			for (const error of errors) {
				const prefix = formatError(`Dependency ${formatDepName(error.name)} at ${formatPath(error.path)} could not be removed:`);
				switch (error.type) {
					case "notRequired":
						console.log(`${prefix} it is not required at that path.\n`);
						break;

					case "notInstalledInRoot":
						console.log(`${prefix} it is not installed in the root.\n`);
						break;

					case "requiredMajorMissmatchesRoot":
						console.log(`${prefix} the required major version missmatches the root's major version:\n  Root version:${formatVersion(error.rootVersion)}\n  Required version: ${formatVersion(error.requiredVersion)}\n`);
						break;

					case "requiredMinorExceedsRoot":
						console.log(`${prefix} the required minor version is higher than the root's minor version:\n  Root version:${formatVersion(error.rootVersion)}\n  Required version: ${formatVersion(error.requiredVersion)}\n`);
						break;
				}
			}

			console.log(`Remaining dependencies are not checked because fixing the current installation failed.`);
			process.exitCode = 1;
			return;
		}

		[packageInfo, packageLock] = await readPackageFiles(context);
	}

	const errors = configs.map(config => check(packageInfo, packageLock, config)).flat(1);
	if (errors.length > 0) {
		process.exitCode = 1;
		for (const error of errors) {
			switch (error.type) {
				case "duplicate":
					console.log(`${formatError(`Multiple versions of ${formatDepName(error.name)} are installed:`)}\n${
						Array.from(error.versions).map(([version, { paths }]) => {
							return `  ${formatVersion(version)} ${formatSecondary("is installed in")} ${
								paths.map(formatPath).join(formatSecondary(`\n${"".padStart(version.length + 16, " ")}and `))
							}`;
						}).join("\n")
					}\n`);
					break;

				case "missmatch":
					console.log(`${formatError(`Different versions of ${formatDepName(error.name)} are required:`)}\n${
						Array.from(error.versions).map(([version, { paths }]) => {
							return `  ${formatVersion(version)} ${formatSecondary("is required by")} ${
								paths.map(formatPath).join(formatSecondary(`\n${"".padStart(version.length + 15, " ")}and `))
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

function formatDepName(name: string) {
	return colors.yellow(name);
}

function formatVersion(version: string | SemVer) {
	return colors.cyan(`v${typeof version === "string" ? version : version.version}`);
}

function formatError(text: string) {
	return colors.red(text);
}

function formatSecondary(text: string) {
	return colors.gray(text);
}

function formatPath(path: string[]) {
	return path.length === 0
		? "<this package>"
		: path.map(colors.yellow).join(colors.gray(" => "));
}
