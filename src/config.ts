import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export interface ConfigJson {
	extends?: string;
	noDuplicates?: string[];
	sameVersions?: (string | string[])[];
}

export interface Config {
	noDuplicates: string[];
	sameVersions: (string | string[])[];
}

export async function getConfig(context: string, json: ConfigJson | string): Promise<Config> {
	const config: Config = {
		noDuplicates: [],
		sameVersions: [],
	};

	async function follow(filename: string): Promise<void> {
		const json = JSON.parse(await readFile(filename, "utf-8"));
		use(dirname(filename), json);
	}

	async function use(context: string, json: ConfigJson): Promise<void> {
		if (json.extends) {
			await follow(resolve(context, json.extends));
		}
		if (json.noDuplicates) {
			config.noDuplicates?.push(...json.noDuplicates);
		}
		if (json.sameVersions) {
			config.sameVersions?.push(...json.sameVersions);
		}
	}

	if (typeof json === "string") {
		await follow(resolve(context, json));
	} else {
		await use(context, json);
	}

	return config;
}
