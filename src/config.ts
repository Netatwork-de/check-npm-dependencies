import { dirname, resolve } from "path";
import { readFile } from "fs/promises";
import json5 from "json5";
import type { Package } from "./common/package-types";

export type ConfigJson = string | ConfigJsonObject | (ConfigJson)[];

export interface ConfigJsonObject {
	extends?: string;
	dev?: boolean;
	patterns?: string[];
	rules?: {
		noDuplicates?: boolean;
		noMissmatch?: boolean;
	};
}

export interface Config {
	readonly dev: boolean;
	readonly patterns: string[];
	readonly rules: {
		readonly noDuplicates: boolean;
		readonly noMissmatch: boolean;
	};
}

export function normalizeConfig(config: ConfigJsonObject, parent?: ConfigJsonObject): Config {
	const dev = config.dev ?? parent?.dev ?? false;
	if (typeof dev !== "boolean") {
		throw new TypeError("config.dev must be a boolean.");
	}

	const patterns = config.patterns ?? parent?.patterns ?? ["*"];
	if (!Array.isArray(patterns) || patterns.some(pattern => typeof pattern !== "string")) {
		throw new TypeError("config.patterns must be an array of strings.");
	}

	const rules = config.rules ?? parent?.rules;
	if (rules !== undefined && (rules === null || typeof rules !== "object")) {
		throw new TypeError("config.rules must be an object.");
	}

	function ruleFlag(name: keyof Config["rules"]) {
		return rules === undefined ? true : Boolean(rules[name]);
	}

	return {
		dev,
		patterns,
		rules: {
			noDuplicates: ruleFlag("noDuplicates"),
			noMissmatch: ruleFlag("noMissmatch")
		}
	};
}

export async function loadConfigs(json: ConfigJson, context: string): Promise<Config[]> {
	if (typeof json === "string") {
		const filename = resolve(context, json);
		const data = await readFile(filename, "utf-8").then(json5.parse);
		return loadConfigs(data, dirname(filename));
	} else if (Array.isArray(json)) {
		return (await Promise.all(json.map(child => loadConfigs(child, context)))).flat();
	} else {
		if (json.extends) {
			const parents = await loadConfigs(json.extends, context);
			return parents.map(parent => normalizeConfig(json, parent));
		} else {
			return [normalizeConfig(json)];
		}
	}
}

export async function getConfigs(packageInfo: Package, context: string) {
	if (packageInfo.nawCheckNpmDependencies) {
		return loadConfigs(packageInfo.nawCheckNpmDependencies, context);
	}
	return [];
}
